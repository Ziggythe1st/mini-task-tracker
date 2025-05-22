process.env.NODE_ENV = "test";

const fs = require("fs");
const supertest = require("supertest");
const server = require("../src/server");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
require("dotenv").config();

const DB_PATH = path.join(__dirname, "../", process.env.DB_FILE);

function resetDatabase(done) {
  const db = new sqlite3.Database(DB_PATH);
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    db.run("DELETE FROM tasks");
    db.run("DELETE FROM sqlite_sequence WHERE name='tasks'");
    db.run("INSERT INTO tasks (title, completed) VALUES ('Test Task 1', 0)");
    db.run("INSERT INTO tasks (title, completed) VALUES ('Test Task 2', 1)");
    db.run("COMMIT", (err) => {
      db.close((closeErr) => {
        done(err || closeErr);
      });
    });
  });
}

const fileHelpers = require("../src/utils/fileHelpers");

const originalCreateTask = fileHelpers.createTask;
fileHelpers.createTask = (task, callback) => {
  originalCreateTask(task, (err, result) => {
    if (
      err &&
      err.message &&
      err.message.includes("UNIQUE constraint failed: tasks.title")
    ) {
      callback({ status: 400, message: "Task title must be unique" });
    } else {
      callback(err, result);
    }
  });
};

describe("Task API (SQLite)", () => {
  beforeEach((done) => resetDatabase(done));

  afterAll(() => {
    server.close();
  });

  describe("Rate Limiting", () => {
    const originalEnv = process.env.NODE_ENV;

    beforeAll(() => {
      process.env.NODE_ENV = "production"; // Enable rate limiting
    });

    afterAll(() => {
      process.env.NODE_ENV = originalEnv; // Restore test environment
    });

    it("should return 429 after too many requests", async () => {
      for (let i = 0; i < 100; i++) {
        await supertest(server).get("/tasks");
      }
      const response = await supertest(server).get("/tasks");
      expect(response.status).toBe(429);
      expect(response.body).toEqual({ error: "Too many requests, slow down." });
    });
  });

  describe("CORS headers", () => {
    const allowedOrigin = "http://localhost:3000";
    const disallowedOrigin = "http://unauthorized.com";

    it("includes CORS headers for allowed origin", async () => {
      const response = await supertest(server)
        .get("/tasks")
        .set("Origin", allowedOrigin);

      expect(response.headers["access-control-allow-origin"]).toBe(
        allowedOrigin
      );
      expect(response.headers["access-control-allow-methods"]).toBe(
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      expect(response.headers["access-control-allow-headers"]).toBe(
        "Content-Type, Authorization"
      );
    });

    it("responds with 204 for preflight OPTIONS request", async () => {
      const response = await supertest(server)
        .options("/tasks")
        .set("Origin", allowedOrigin)
        .set("Access-Control-Request-Method", "POST");

      expect(response.status).toBe(204);
      expect(response.headers["access-control-allow-origin"]).toBe(
        allowedOrigin
      );
      expect(response.headers["access-control-allow-methods"]).toBe(
        "GET, POST, PUT, DELETE, OPTIONS"
      );
    });

    it("does not include CORS headers for disallowed origin", async () => {
      const response = await supertest(server)
        .get("/tasks")
        .set("Origin", disallowedOrigin);

      expect(response.headers["access-control-allow-origin"]).toBeUndefined();
    });
  });

  it("PUT /tasks/:id fails with invalid JSON", async () => {
    const response = await supertest(server)
      .put("/tasks/1")
      .set("Content-Type", "application/json")
      .send("Invalid JSON");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Invalid JSON" });
  });

  it("PUT /tasks/:id fails when task not found", async () => {
    const response = await supertest(server)
      .put("/tasks/999")
      .send({ title: "Doesn't Exist", completed: true })
      .set("Content-Type", "application/json");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Task not found" });
  });

  it("DELETE /tasks/:id fails when task not found", async () => {
    const response = await supertest(server).delete("/tasks/999");
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Task not found" });
  });

  const invalidIds = ["abc", "-1", "0", "1.5", "@!"];
  invalidIds.forEach((invalidId) => {
    it(`GET /tasks/${invalidId} returns 400 for invalid ID`, async () => {
      const response = await supertest(server).get(`/tasks/${invalidId}`);
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "Invalid task ID" });
    });

    it(`PUT /tasks/${invalidId} returns 400 for invalid ID`, async () => {
      const response = await supertest(server)
        .put(`/tasks/${invalidId}`)
        .send({ title: "Anything", completed: true })
        .set("Content-Type", "application/json");
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "Invalid task ID" });
    });

    it(`DELETE /tasks/${invalidId} returns 400 for invalid ID`, async () => {
      const response = await supertest(server).delete(`/tasks/${invalidId}`);
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "Invalid task ID" });
    });
  });
});
