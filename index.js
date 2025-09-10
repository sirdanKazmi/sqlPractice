// CJS
const { faker } = require("@faker-js/faker");
const mysql = require("mysql2");
const express = require("express");
const app = express();
const port = 7070;
const path = require('path')
const methodOverride = require('method-override');
const { v4: uuidv4 } = require("uuid");


app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.set('view engine', 'ejs')
app.set("views" ,path.join(__dirname, 'views'))

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "sqlpractice",
  // port: 3306,
  password: "Your password",
});

app.get('/users/new', (req, res)=>{
  const user = {
    avatar: '',
    username: '',
    email: '',
    birthdateISO: '',
    status: 'pending',
    notes: ''
  };
  res.render('new.ejs', { user });
})

app.post("/users", (req, res) => { 
  const {
    password,
    avatar,
    username,
    email,
    birthdate,
  } = req.body;

    try {
      if (password === '') {
        return res.status(403).send("Pasword must required");
      }

      let id = uuidv4(); 
      const cleanUsername = (username || "").trim();
      const cleanEmail = (email || "").trim().toLowerCase();
      const cleanAvatar = (avatar || "").trim() || null;
      let regAt = Date.now();

      let birthdateSQL = null;
      if (birthdate && /^\d{4}-\d{2}-\d{2}$/.test(birthdate)) {
        birthdateSQL = birthdate; // MySQL DATE-friendly
      }
      let registrationAtSQL = null;
      if (regAt && /^\d{4}-\d{2}-\d{2}$/.test(regAt)) {
        registrationAtSQL = regAt; // MySQL DATE-friendly
      }

      if (!cleanUsername) return res.status(400).send("Username is required");
      if (!cleanEmail) return res.status(400).send("Email is required");

      let q = 'INSERT INTO users (userId, username, email, avatar, password, birthdate, registeredAt) VALUES ?';
      const params = [[
        id,
        cleanUsername,
        cleanEmail,
        cleanAvatar,
        password,
        birthdateSQL,
        registrationAtSQL
        
      ]];

      connection.query(q, [params], (addErr) => {
        if (addErr) {
          console.error(addErr);
          return res.status(500).send("Failed to add user");
        }
        return res.redirect(`/users`);
      });
    } catch (e) {
      console.error(e);
      return res.status(500).send(`Error: ${e}`);
    }
});

app.get("/", (req, res) => {
  let q = "SELECT count(*) AS total FROM users;";
  let count;
  try {
    connection.query(q, (error, result) => {
      if (error) throw error;
      count = result[0].total;
      res.render('home.ejs',{count})
    });
  } catch (error) {
    return res.status(500).send("Database error");
  }
});

app.get("/users", (req, res) => {
  let q = "SELECT * FROM users;";
 try {
    connection.query(q, (error, result) => {
      if (error) throw error;
      res.render('showUser.ejs',{result})
    });
  } catch (error) {
    return res.status(500).send("Database error");
  }
});

app.get("/user/:id/edit", (req, res) => {
  const {id} = req.params; // UUID like '1164...'
  const sql = "SELECT * FROM `users` WHERE `userId` = ? LIMIT 1";

  connection.query(sql, [id], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Database error");
    }
    if (rows.length === 0) {
      return res.status(404).send("User not found");
    }

    const u = rows[0];
    console.log(u.password);
    // Prepare ISO strings for <input type="date/datetime-local">
    const birthdateISO = u.birthdate ? new Date(u.birthdate).toISOString().slice(0,10) : "";
    const registeredAtISO = u.registeredAt ? new Date(u.registeredAt - (new Date().getTimezoneOffset()*60000)).toISOString().slice(0,16) : "";

    res.render("editUser.ejs", { 
      user: { ...u, birthdateISO, registeredAtISO }, 
      csrfToken: req.csrfToken?.(), 
      flash: req.flash?.() 
    });
  });
});


app.patch("/users/:id", (req, res) => {
  const { id } = req.params;
  const {
    password: formPassword,
    avatar: avatarUrl,
    username,
    email,
    birthdate,
    status,
    notes
  } = req.body;

  const sql = "SELECT * FROM `users` WHERE `userId` = ? LIMIT 1";

  connection.query(sql, [id], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Database error");
    }
    if (rows.length === 0) {
      return res.status(404).send("User not found");
    }

    const u = rows[0];
     console.log(u.password); // ❌ avoid logging secrets

    try {
      if ((u.password || "") !== (formPassword || "")) {
        return res.status(403).send("Invalid password for edit");
      }

      // validation / normalization
      const allowedStatus = new Set(["active", "suspended", "pending"]);
      const cleanStatus = allowedStatus.has((status || "").toLowerCase())
        ? (status || "").toLowerCase()
        : "pending";

      const cleanUsername = (username || "").trim();
      const cleanEmail = (email || "").trim().toLowerCase();
      const cleanAvatar = (avatarUrl || "").trim() || null;
      const cleanNotes = (notes || "").trim() || null;

      let birthdateSQL = null;
      if (birthdate && /^\d{4}-\d{2}-\d{2}$/.test(birthdate)) {
        birthdateSQL = birthdate; // MySQL DATE-friendly
      }

      if (!cleanUsername) return res.status(400).send("Username is required");
      if (!cleanEmail) return res.status(400).send("Email is required");

      const updateSql = `
        UPDATE \`users\`
        SET avatar = ?, username = ?, email = ?, birthdate = ?
        WHERE userId = ?
        LIMIT 1
      `;
      const params = [
        cleanAvatar,
        cleanUsername,
        cleanEmail,
        birthdateSQL,
        id
      ];

      connection.query(updateSql, params, (updErr) => {
        if (updErr) {
          console.error(updErr);
          return res.status(500).send("Failed to update user");
        }
        return res.redirect(`/users`);
      });
    } catch (e) {
      console.error(e);
      return res.status(500).send("Password check failed");
    }
  });
});

app.delete("/user/:id", (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM `users` WHERE `userId` = ? LIMIT 1";

  try {
    connection.query(sql, [id], (error, result) => {
      if (error) {
        console.error(error);
        return res.status(500).send("Database Error");
      }

      if (result.affectedRows === 0) {
        return res.status(404).send("User not found");
      }

      // Redirect back to users list after delete
      return res.redirect("/users"); 
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Unexpected server error");
  }
});







app.listen(port, () => {
  console.log(`App is listining on port ${port}`);
});

// let generateUsers =  ()=> {
//   return [
//     faker.string.uuid(),
//     faker.internet.username(),
//     faker.internet.email(),
//     faker.image.avatar(),
//     faker.internet.password(),
//     faker.date.birthdate(),
//     faker.date.past(),
//   ];
// }
// let q = 'INSERT INTO users (userId, username, email, avatar, password, birthdate, registeredAt) VALUES ?';
// let data = []
// for (let i = 0 ; i<50; i++){
//     data[i] = generateUsers();

// }

// connection.query(q,[data], (Error,result)=>{
//     console.log(Error)
//   console.log(result);
// });

// connection.end();
