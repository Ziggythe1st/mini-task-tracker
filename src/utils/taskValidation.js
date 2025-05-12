function validateTask(task) {
  if (!task.title || typeof task.title !== "string") {
    return "Task must have a valid title";
  }

  if (task.completed !== undefined && typeof task.completed !== "boolean") {
    return "Task completed must be a boolean";
  }

  return null;
}

function validateTaskUpdate(updates) {
  if (updates.title !== undefined && typeof updates.title !== "string") {
    return "Task title must be a string";
  }

  if (
    updates.completed !== undefined &&
    typeof updates.completed !== "boolean"
  ) {
    return "Task completed must be a boolean";
  }

  return null;
}

module.exports = { validateTask, validateTaskUpdate };
