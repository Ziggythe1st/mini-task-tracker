const {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} = require("../utils/fileHelpers");
const { validateTask, validateTaskUpdate } = require("../utils/taskValidation");
const handleError = require("../utils/errorHandler");

function taskRoutes(req, res) {
  const { method, url } = req;
  const id = Number(url.split("/").pop());

  const isIdInvalid =
    url.startsWith("/tasks/") && (!Number.isInteger(id) || id <= 0);
  if (isIdInvalid) {
    return handleError(res, 400, "Invalid task ID");
  }

  if (method === "GET" && url === "/tasks") {
    getAllTasks((err, tasks) => {
      if (err) return handleError(res, 500, "Failed to fetch tasks");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(tasks));
    });
  } else if (method === "GET" && url.startsWith("/tasks/")) {
    getTaskById(id, (err, task) => {
      if (err) return handleError(res, 500, "Failed to fetch task");
      if (!task) return handleError(res, 404, "Task not found");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(task));
    });
  } else if (method === "POST" && url === "/tasks") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const task = JSON.parse(body);
        const error = validateTask(task);
        if (error) return handleError(res, 400, error);

        createTask(task, (err, result) => {
          if (err) {
            if (err.status === 400) {
              return handleError(res, 400, err.message);
            }
            return handleError(res, 500, "Failed to create task");
          }
          res.writeHead(201, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ id: result.id }));
        });
      } catch (e) {
        handleError(res, 400, "Invalid JSON");
      }
    });
  } else if (method === "PUT" && url.startsWith("/tasks/")) {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const update = JSON.parse(body);
        const error = validateTaskUpdate(update);
        if (error) return handleError(res, 400, error);

        updateTask(id, update, (err, result) => {
          if (err) return handleError(res, 500, "Failed to update task");
          if (result.changes === 0)
            return handleError(res, 404, "Task not found");
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ updated: true }));
        });
      } catch (e) {
        handleError(res, 400, "Invalid JSON");
      }
    });
  } else if (method === "DELETE" && url.startsWith("/tasks/")) {
    deleteTask(id, (err, result) => {
      if (err) return handleError(res, 500, "Failed to delete task");
      if (result.changes === 0) return handleError(res, 404, "Task not found");
      res.writeHead(204);
      res.end();
    });
  } else {
    handleError(res, 404, "Route not found");
  }
}

module.exports = taskRoutes;
