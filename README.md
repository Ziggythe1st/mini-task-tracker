# 📝 Mini Task Tracker

A lightweight Node.js HTTP server for managing tasks with full CRUD (Create, Read, Update, Delete) functionality, logging, error handling, rate limiting, and CORS support. Ideal for learning raw Node.js server patterns and demonstrating backend fundamentals.

---

## 🚀 Features

- 📦 Raw Node.js HTTP Server — built without Express
- 💾 SQLite-backed task storage
- ✅ Full CRUD API (Create, Read, Update, Delete)
- 🔒 Validation for input data and task schema
- 🛡️ Rate limiting with IP tracking
- 🌐 CORS protection (whitelisted origins)
- 📄 Logging to console and file
- 🧪 Tested with Jest + Supertest

---

## 🧰 Tech Stack

- Node.js
- SQLite3
- Jest + Supertest (for testing)

---

## 🛠️ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/mini-task-tracker.git
cd mini-task-tracker
npm install
```

### 2. Create the Database

```bash
npm run migrate
```

### 3. Configure the Enviroment 

Create a .env file: 

PORT=3000
DB_FILE=tasks.db
ALLOWED_ORIGINS=http://localhost:3000

### 4. Start the Server

```bash
npm start
```

### Run tests

```bash
npm run test
```