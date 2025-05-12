require("dotenv").config();
const http = require("http");
const taskRoutes = require("./routes/tasks");
const { logger, consoleLogger } = require("./utils/logger");

// Create the server
const server = http.createServer((req, res) => {
  // Log to console and file
  consoleLogger(req, res, () => {});
  logger(req, res, () => {});

  taskRoutes(req, res);
});

// Use the PORT from .env or default to 3000
const PORT = process.env.PORT || 3000;

// Start the server if not in test mode
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
  });
}

module.exports = server;
