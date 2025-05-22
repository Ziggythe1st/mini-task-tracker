const rateLimitMap = new Map();

const RATE_LIMIT = 100; // requests
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function rateLimiter(req, res) {
  if (process.env.NODE_ENV === "test") return true;

  const ip = req.socket.remoteAddress;
  const now = Date.now();

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }

  const timestamps = rateLimitMap.get(ip).filter((t) => now - t < WINDOW_MS);
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);

  if (timestamps.length > RATE_LIMIT) {
    res.writeHead(429, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Too many requests, slow down." }));
    return false;
  }

  return true;
}

module.exports = rateLimiter;
