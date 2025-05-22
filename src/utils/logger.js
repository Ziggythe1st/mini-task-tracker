const fs = require("fs");
const path = require("path");

const logFilePath = path.join(__dirname, "../../logs.txt");

function logger(req, res, next) {
  const start = Date.now();

  // Hook into the response's finish event to log after response is sent
  res.on("finish", () => {
    const duration = Date.now() - start;
    const logLine = `${new Date().toISOString()} ${req.method} ${req.url} ${
      res.statusCode
    } ${duration}ms\n`;
    fs.appendFile(logFilePath, logLine, (err) => {
      if (err) console.error("Failed to write to log file:", err);
    });
  });

  next();
}

function consoleLogger(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.url} => ${res.statusCode} (${duration}ms)`
    );
  });
  next();
}

module.exports = { logger, consoleLogger };
