# Node.js + Express + MySQL CRUD (EJS)

A clean starter that demonstrates **Create / Read / Update / Delete** over MySQL using **Express 5**, **EJS** views, and safe queries with **mysql2**.  
Includes method override for HTML forms and UUID-based primary keys.

> Author: **Syed Sirdan Ali**

---

## Features
- ✅ Full CRUD: **add, list, edit, delete**
- ✅ Server-rendered UI with **EJS**
- ✅ **mysql2** prepared statements (`?`) for safety
- ✅ **UUID v4** user IDs (`uuid` package)
- ✅ **method-override** to support `PATCH` & `DELETE` via forms
- ✅ Simple Faker-based seeding snippet (commented in code)

---

## Tech Stack
- **Runtime:** Node.js (CommonJS)
- **Server:** Express **5.x**
- **Views:** EJS **3.x**
- **DB:** MySQL 8.x via **mysql2**
- **Utilities:** `method-override`, `uuid`, `@faker-js/faker` (dev)

---

## Getting Started

### 1) Clone & Install
```bash
npm install
### 2) Run the backend
nodemon index.js
