const fs = require("fs");

function validateTask(task) {
  // Validate title
  if (
    !task.title ||
    typeof task.title !== "string" ||
    task.title.trim() === ""
  ) {
    return "Task must have a valid, non-empty title";
  }

  // Validate title length
  if (task.title.length > 100) {
    return "Task title must be 100 characters or fewer";
  }

  // Validate duplicate title
  const tasks = JSON.parse(fs.readFileSync("./tasks.json", "utf8"));
  const isDuplicate = tasks.some(
    (existingTask) =>
      existingTask.title.toLowerCase() === task.title.toLowerCase()
  );

  if (isDuplicate) {
    return "Task title must be unique";
  }

  // Validate completed
  if (task.completed !== undefined && typeof task.completed !== "boolean") {
    return "Task completed must be a boolean";
  }

  return null;
}

function validateTaskUpdate(updates) {
  // Validate title if present
  if (updates.title !== undefined) {
    if (typeof updates.title !== "string" || updates.title.trim() === "") {
      return "Task title must be a non-empty string";
    }

    if (updates.title.length > 100) {
      return "Task title must be 100 characters or fewer";
    }
  }

  // Validate completed if present
  if (
    updates.completed !== undefined &&
    typeof updates.completed !== "boolean"
  ) {
    return "Task completed must be a boolean";
  }

  return null;
}

module.exports = { validateTask, validateTaskUpdate };
