const fs = require("fs");
require("dotenv").config();

const DB_FILE = process.env.DB_FILE || "./tasks.json";

function loadTasks() {
  try {
    const data = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function saveTasks(tasks) {
  fs.writeFileSync(DB_FILE, JSON.stringify(tasks, null, 2));
}

module.exports = { loadTasks, saveTasks };
