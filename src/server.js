require("dotenv").config();
const http = require("http");
const taskRoutes = require("./routes/tasks");
const { logger, consoleLogger } = require("./utils/logger");
const rateLimiter = require("./utils/rateLimiter");

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS.split(",");

// Create the server
const server = http.createServer((req, res) => {
  // Log to console and file
  consoleLogger(req, res, () => {});
  logger(req, res, () => {});

  // Rate limiting
  if (!rateLimiter(req, res)) return;

  // CORS headers
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  if (origin && !allowedOrigins.includes(origin)) {
    console.warn(`Blocked CORS request from disallowed origin: ${origin}`);
  }

  // Preflight request handling
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Handle task routes
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
