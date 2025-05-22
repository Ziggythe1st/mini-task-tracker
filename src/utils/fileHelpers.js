require("dotenv").config();
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const DB_FILE = path.join(__dirname, "../../", process.env.DB_FILE);

function withDB(callback) {
  const db = new sqlite3.Database(DB_FILE);
  callback(db, () => {
    db.close((err) => {
      if (err) console.error("Failed to close DB:", err);
    });
  });
}

function getAllTasks(callback) {
  withDB((db, done) => {
    db.all("SELECT * FROM tasks", [], (err, rows) => {
      callback(err, rows);
      done();
    });
  });
}

function getTaskById(id, callback) {
  withDB((db, done) => {
    db.get("SELECT * FROM tasks WHERE id = ?", [id], (err, row) => {
      callback(err, row);
      done();
    });
  });
}

function createTask(task, callback) {
  withDB((db, done) => {
    const sql = `INSERT INTO tasks (title, completed) VALUES (?, ?)`;
    db.run(sql, [task.title, task.completed ?? false], function (err) {
      if (err) {
        if (err.message.includes("UNIQUE constraint failed: tasks.title")) {
          callback({ status: 400, message: "Task title must be unique" });
        } else {
          callback(err);
        }
      } else {
        callback(null, { id: this?.lastID });
      }
      done();
    });
  });
}

function updateTask(id, updated, callback) {
  withDB((db, done) => {
    const sql = `UPDATE tasks SET title = ?, completed = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    db.run(sql, [updated.title, updated.completed, id], function (err) {
      callback(err, { changes: this?.changes });
      done();
    });
  });
}

function deleteTask(id, callback) {
  withDB((db, done) => {
    db.run("DELETE FROM tasks WHERE id = ?", [id], function (err) {
      callback(err, { changes: this?.changes });
      done();
    });
  });
}

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};
