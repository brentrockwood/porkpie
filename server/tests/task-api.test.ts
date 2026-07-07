import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { TaskService } from "../src/tasks/task-service.js";
import { InMemoryTaskRepository } from "./in-memory-task-repository.js";

function testApp() {
  return createApp(new TaskService(new InMemoryTaskRepository()));
}

describe("task API", () => {
  it("serves OpenAPI documentation", async () => {
    const app = testApp();

    const spec = await request(app).get("/openapi.json").expect(200);
    expect(spec.body.openapi).toBe("3.1.0");
    expect(spec.body.paths["/api/tasks"]).toBeDefined();

    await request(app).get("/docs/").expect(200).expect("Content-Type", /html/);
  });

  it("supports the task lifecycle", async () => {
    const app = testApp();

    const created = await request(app)
      .post("/api/tasks")
      .send({ title: " Buy milk ", description: " oat milk " })
      .expect(201);

    expect(created.body.task).toMatchObject({
      title: "Buy milk",
      description: "oat milk",
      completed: false,
    });

    const id = created.body.task.id;

    const listed = await request(app).get("/api/tasks").expect(200);
    expect(listed.body.tasks).toHaveLength(1);

    const updated = await request(app)
      .patch(`/api/tasks/${id}`)
      .send({ completed: true })
      .expect(200);
    expect(updated.body.task.completed).toBe(true);

    await request(app).delete(`/api/tasks/${id}`).expect(204);

    const empty = await request(app).get("/api/tasks").expect(200);
    expect(empty.body.tasks).toHaveLength(0);
  });

  it("rejects blank task titles", async () => {
    const app = testApp();

    const response = await request(app).post("/api/tasks").send({ title: "   " }).expect(400);
    expect(response.body.error).toBe("title is required");
  });
});
