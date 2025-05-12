const url = require("url");
const { loadTasks, saveTasks } = require("../utils/fileHelpers");
const handleError = require("../utils/errorHandler");

module.exports = (req, res) => {
  const { method, url: requestUrl } = req;
  const tasks = loadTasks();
  const parsedUrl = url.parse(requestUrl, true);
  const pathParts = parsedUrl.pathname.split("/").filter(Boolean);

  // POST /tasks
  if (method === "POST" && pathParts[0] === "tasks" && pathParts.length === 1) {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const newTask = JSON.parse(body);

        // Validate task title
        if (!newTask.title || typeof newTask.title !== "string") {
          return handleError(res, 400, "Task must have a valid title");
        }

        // Set default completed status
        newTask.completed = !!newTask.completed;
        newTask.id = tasks.length > 0 ? tasks[tasks.length - 1].id + 1 : 1;
        tasks.push(newTask);
        saveTasks(tasks);

        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify(newTask));
      } catch (error) {
        return handleError(res, 400, "Invalid JSON");
      }
    });
    return;
  }

  // GET /tasks
  if (method === "GET" && pathParts[0] === "tasks" && pathParts.length === 1) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(tasks));
    return;
  }

  // GET /tasks/:id
  if (method === "GET" && pathParts[0] === "tasks" && pathParts.length === 2) {
    const taskId = parseInt(pathParts[1]);
    const task = tasks.find((t) => t.id === taskId);

    if (!task) {
      return handleError(res, 404, "Task not found");
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(task));
    return;
  }

  // PUT /tasks/:id
  if (method === "PUT" && pathParts[0] === "tasks" && pathParts.length === 2) {
    const taskId = parseInt(pathParts[1]);
    const taskIndex = tasks.findIndex((t) => t.id === taskId);

    if (taskIndex === -1) {
      return handleError(res, 404, "Task not found");
    }

    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const updates = JSON.parse(body);

        // Validate title if present
        if (updates.title !== undefined && typeof updates.title !== "string") {
          return handleError(res, 400, "Task title must be a string");
        }

        // Validate completed if present
        if (
          updates.completed !== undefined &&
          typeof updates.completed !== "boolean"
        ) {
          return handleError(res, 400, "Task completed must be a boolean");
        }

        tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
        saveTasks(tasks);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(tasks[taskIndex]));
      } catch (error) {
        return handleError(res, 400, "Invalid JSON");
      }
    });
    return;
  }

  // DELETE /tasks/:id
  if (
    method === "DELETE" &&
    pathParts[0] === "tasks" &&
    pathParts.length === 2
  ) {
    const taskId = parseInt(pathParts[1]);
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

  // Not found
  handleError(res, 404, "Not found");
};
