const fs = require("fs");
const supertest = require("supertest");
const server = require("../src/server");

// Reset the task file before each test
beforeEach(() => {
  fs.writeFileSync("./tasks.json", "[]");
});

// Close the server after all tests
afterAll(() => {
  server.close();
});

describe("Task Tracker API", () => {
  it("should return an empty task list on startup", async () => {
    const response = await supertest(server).get("/tasks");
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("should add a task with POST /tasks", async () => {
    const response = await supertest(server)
      .post("/tasks")
      .send({ title: "Test Task", completed: false })
      .set("Content-Type", "application/json");

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      title: "Test Task",
      completed: false,
      id: 1,
    });
  });

  it("should return a task by ID with GET /tasks/:id", async () => {
    await supertest(server)
      .post("/tasks")
      .send({ title: "Test Task", completed: false })
      .set("Content-Type", "application/json");

    const response = await supertest(server).get("/tasks/1");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      title: "Test Task",
      completed: false,
      id: 1,
    });
  });

  it("should return 404 for a non-existent task", async () => {
    const response = await supertest(server).get("/tasks/999");
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Task not found" });
  });

  it("should update a task with PUT /tasks/:id", async () => {
    await supertest(server)
      .post("/tasks")
      .send({ title: "Test Task", completed: false })
      .set("Content-Type", "application/json");

    const response = await supertest(server)
      .put("/tasks/1")
      .send({ title: "Updated Task", completed: true })
      .set("Content-Type", "application/json");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      title: "Updated Task",
      completed: true,
      id: 1,
    });
  });

  it("should delete a task with DELETE /tasks/:id", async () => {
    await supertest(server)
      .post("/tasks")
      .send({ title: "Test Task", completed: false })
      .set("Content-Type", "application/json");

    const response = await supertest(server).delete("/tasks/1");
    expect(response.status).toBe(204);
  });

  it("should return 400 for missing title in POST /tasks", async () => {
    const response = await supertest(server)
      .post("/tasks")
      .send({ completed: false })
      .set("Content-Type", "application/json");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Task must have a valid, non-empty title",
    });
  });

  it("should return 400 for duplicate titles in POST /tasks", async () => {
    await supertest(server)
      .post("/tasks")
      .send({ title: "Test Task", completed: false })
      .set("Content-Type", "application/json");

    const response = await supertest(server)
      .post("/tasks")
      .send({ title: "Test Task" })
      .set("Content-Type", "application/json");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Task title must be unique" });
  });

  it("should return 400 for title longer than 100 characters in POST /tasks", async () => {
    const longTitle = "a".repeat(101);
    const response = await supertest(server)
      .post("/tasks")
      .send({ title: longTitle, completed: false })
      .set("Content-Type", "application/json");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Task title must be 100 characters or fewer",
    });
  });

  it("should return 400 for invalid JSON in POST /tasks", async () => {
    const response = await supertest(server)
      .post("/tasks")
      .send("Invalid JSON")
      .set("Content-Type", "application/json");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Invalid JSON" });
  });

  it("should return 404 for non-existent task on PUT", async () => {
    const response = await supertest(server)
      .put("/tasks/999")
      .send({ title: "Non-existent Task" })
      .set("Content-Type", "application/json");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Task not found" });
  });

  it("should return 404 for non-existent task on DELETE", async () => {
    const response = await supertest(server).delete("/tasks/999");
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Task not found" });
  });

  it("should return 400 for non-boolean completed value in POST /tasks", async () => {
    const response = await supertest(server)
      .post("/tasks")
      .send({ title: "Task with Invalid Completed", completed: "yes" })
      .set("Content-Type", "application/json");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Task completed must be a boolean",
    });
  });

  const invalidIds = ["abc", "-1", "0", "1.5", "@!"];

  invalidIds.forEach((invalidId) => {
    it(`should return 400 for invalid task ID (${invalidId}) on GET /tasks/:id`, async () => {
      const response = await supertest(server).get(`/tasks/${invalidId}`);
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "Invalid task ID" });
    });

    it(`should return 400 for invalid task ID (${invalidId}) on PUT /tasks/:id`, async () => {
      const response = await supertest(server)
        .put(`/tasks/${invalidId}`)
        .send({ title: "Updated Task" })
        .set("Content-Type", "application/json");
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "Invalid task ID" });
    });

    it(`should return 400 for invalid task ID (${invalidId}) on DELETE /tasks/:id`, async () => {
      const response = await supertest(server).delete(`/tasks/${invalidId}`);
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "Invalid task ID" });
    });
  });

  const unsupportedTests = [
    { method: "PUT", path: "/tasks" },
    { method: "DELETE", path: "/tasks" },
    { method: "POST", path: "/tasks/1" },
    { method: "PATCH", path: "/tasks" },
    { method: "PATCH", path: "/tasks/1" },
  ];

  unsupportedTests.forEach(({ method, path }) => {
    it(`should return 405 for unsupported ${method} method at ${path}`, async () => {
      const response = await supertest(server)
        [method.toLowerCase()](path)
        .send({ title: "Should Fail" })
        .set("Content-Type", "application/json");

      expect(response.status).toBe(405);
      expect(response.body).toEqual({ error: "Method not allowed" });
    });
  });

  // CORS Testing

  // CORS Tests
  const allowedOrigin = "http://localhost:3000";
  const blockedOrigin = "http://unauthorized.com";

  describe("CORS Headers", () => {
    it("should include CORS headers for allowed origins", async () => {
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
      expect(response.headers["access-control-allow-credentials"]).toBe("true");
    });

    it("should respond with 204 for preflight OPTIONS request", async () => {
      const response = await supertest(server)
        .options("/tasks")
        .set("Origin", allowedOrigin);

      expect(response.status).toBe(204);
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

    it("should not include CORS headers for disallowed origins", async () => {
      const response = await supertest(server)
        .get("/tasks")
        .set("Origin", blockedOrigin);

      expect(response.headers["access-control-allow-origin"]).toBeUndefined();
    });
  });
});
