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
    const newTask = { title: "Test Task", completed: false };
    const response = await supertest(server)
      .post("/tasks")
      .send(newTask)
      .set("Content-Type", "application/json");

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      ...newTask,
      id: 1,
    });
  });

  it("should return a task by ID with GET /tasks/:id", async () => {
    // First, create a task
    const task = { title: "Test Task", completed: false };
    await supertest(server)
      .post("/tasks")
      .send(task)
      .set("Content-Type", "application/json");

    // Then, get it by ID
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
    // First, create a task
    const task = { title: "Test Task", completed: false };
    await supertest(server)
      .post("/tasks")
      .send(task)
      .set("Content-Type", "application/json");

    // Update the task
    const updatedTask = { title: "Updated Task", completed: true };
    const response = await supertest(server)
      .put("/tasks/1")
      .send(updatedTask)
      .set("Content-Type", "application/json");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      title: "Updated Task",
      completed: true,
      id: 1,
    });
  });

  it("should delete a task with DELETE /tasks/:id", async () => {
    // First, create a task
    const task = { title: "Test Task", completed: false };
    await supertest(server)
      .post("/tasks")
      .send(task)
      .set("Content-Type", "application/json");

    // Delete the task
    const deleteResponse = await supertest(server).delete("/tasks/1");
    expect(deleteResponse.status).toBe(204);

    // Confirm it was deleted
    const getResponse = await supertest(server).get("/tasks/1");
    expect(getResponse.status).toBe(404);
    expect(getResponse.body).toEqual({ error: "Task not found" });
  });

  it("should return 400 for invalid JSON in POST /tasks", async () => {
    const response = await supertest(server)
      .post("/tasks")
      .send("Invalid JSON")
      .set("Content-Type", "application/json");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Invalid JSON" });
  });

  it("should return 400 for invalid task updates in PUT /tasks/:id", async () => {
    // First, create a task
    const task = { title: "Test Task", completed: false };
    await supertest(server)
      .post("/tasks")
      .send(task)
      .set("Content-Type", "application/json");

    // Attempt to update with invalid data
    const response = await supertest(server)
      .put("/tasks/1")
      .send({ title: 123 })
      .set("Content-Type", "application/json");
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Task title must be a string" });
  });
});
