require("dotenv").config();
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const DB_FILE = path.join(__dirname, "../../", process.env.DB_FILE);

// Create the database directory if it doesn't exist
const dbDir = path.dirname(DB_FILE);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Connect to the SQLite database
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
    process.exit(1);
  }
  console.log("Connected to the SQLite database.");
});

// Create the tasks table
db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL UNIQUE,
      completed BOOLEAN NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    (err) => {
      if (err) {
        console.error("Error creating tasks table:", err.message);
      } else {
        console.log("Tasks table created successfully.");
      }
    }
  );
});

db.close(() => {
  console.log("Database connection closed.");
});
