const url = require("url");
const { loadTasks, saveTasks } = require("../utils/fileHelpers");
const handleError = require("../utils/errorHandler");
const { validateTask, validateTaskUpdate } = require("../utils/taskValidation");

// Helper function to parse request body
function parseRequestBody(req, res, callback) {
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    try {
      const data = JSON.parse(body);
      callback(data);
    } catch (error) {
      handleError(res, 400, "Invalid JSON");
    }
  });
}

// Validate Task ID Helper
function isValidTaskId(id) {
  return Number.isInteger(id) && id > 0;
}

module.exports = (req, res) => {
  const { method, url: requestUrl } = req;
  const parsedUrl = new URL(requestUrl, `http://${req.headers.host}`);
  const pathParts = parsedUrl.pathname.split("/").filter(Boolean);

  // Reject unsupported methods
  const isTasksCollection = pathParts[0] === "tasks" && pathParts.length === 1;
  const isTaskItem = pathParts[0] === "tasks" && pathParts.length === 2;

  const supportedMethods = {
    "/tasks": ["GET", "POST"],
    "/tasks/:id": ["GET", "PUT", "DELETE"],
  };

  const currentPath = isTasksCollection
    ? "/tasks"
    : isTaskItem
    ? "/tasks/:id"
    : null;

  if (currentPath && !supportedMethods[currentPath].includes(method)) {
    return handleError(res, 405, "Method not allowed");
  }

  // GET /tasks
  if (method === "GET" && pathParts[0] === "tasks" && pathParts.length === 1) {
    const tasks = loadTasks();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(tasks));
    return;
  }

  // GET /tasks/:id
  if (method === "GET" && pathParts[0] === "tasks" && pathParts.length === 2) {
    const taskId = Number(pathParts[1]);

    // Reject invalid IDs
    if (!isValidTaskId(taskId)) {
      return handleError(res, 400, "Invalid task ID");
    }

    const tasks = loadTasks();
    const task = tasks.find((t) => t.id === taskId);

    if (!task) {
      return handleError(res, 404, "Task not found");
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(task));
    return;
  }

  // POST /tasks
  if (method === "POST" && pathParts[0] === "tasks" && pathParts.length === 1) {
    parseRequestBody(req, res, (newTask) => {
      const tasks = loadTasks();

      // Validate the task
      const error = validateTask(newTask);
      if (error) {
        return handleError(res, 400, error);
      }

      // Set default completed status if not provided
      newTask.completed = newTask.completed || false;
      newTask.id = tasks.length > 0 ? tasks[tasks.length - 1].id + 1 : 1;
      tasks.push(newTask);
      saveTasks(tasks);

      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify(newTask));
    });
    return;
  }

  // PUT /tasks/:id
  if (method === "PUT" && pathParts[0] === "tasks" && pathParts.length === 2) {
    const taskId = Number(pathParts[1]);

    // Reject invalid IDs
    if (!isValidTaskId(taskId)) {
      return handleError(res, 400, "Invalid task ID");
    }

    const tasks = loadTasks();
    const taskIndex = tasks.findIndex((t) => t.id === taskId);

    if (taskIndex === -1) {
      return handleError(res, 404, "Task not found");
    }

    parseRequestBody(req, res, (updates) => {
      const error = validateTaskUpdate(updates);
      if (error) {
        return handleError(res, 400, error);
      }

      tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
      saveTasks(tasks);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(tasks[taskIndex]));
    });
    return;
  }

  // DELETE /tasks/:id
  if (
    method === "DELETE" &&
    pathParts[0] === "tasks" &&
    pathParts.length === 2
  ) {
    const taskId = Number(pathParts[1]);

    // Reject invalid IDs
    if (!isValidTaskId(taskId)) {
      return handleError(res, 400, "Invalid task ID");
    }

    const tasks = loadTasks();
    const taskIndex = tasks.findIndex((t) => t.id === taskId);

    if (taskIndex === -1) {
      return handleError(res, 404, "Task not found");
    }

    tasks.splice(taskIndex, 1);
    saveTasks(tasks);

    res.writeHead(204);
    res.end();
    return;
  }

  // Fallback for unknown routes
  handleError(res, 404, "Not found");
};
