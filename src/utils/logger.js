require("dotenv").config();
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");

// Log file location (from .env or default to logs.txt)
const LOG_FILE = process.env.LOG_FILE || "logs.txt";

// Create a write stream for the log file
const logStream = fs.createWriteStream(
  path.join(__dirname, "../..", LOG_FILE),
  { flags: "a" }
);

// Configure Morgan
const logger = morgan("combined", {
  stream: logStream,
});

// Also log to the console
const consoleLogger = morgan("dev");

module.exports = { logger, consoleLogger };
