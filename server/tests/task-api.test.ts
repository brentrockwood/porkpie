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
      tags: [],
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

  it("supports tags, search, and filtering", async () => {
    const app = testApp();

    const shopping = await request(app)
      .post("/api/tasks")
      .send({ title: "Buy coffee", description: "Whole bean", tags: ["Shopping", "Errands"] })
      .expect(201);

    await request(app)
      .post("/api/tasks")
      .send({ title: "Write interview notes", tags: ["work"] })
      .expect(201);

    expect(shopping.body.task.tags).toEqual([
      { name: "errands", source: "manual", confidence: null },
      { name: "shopping", source: "manual", confidence: null },
    ]);

    const tagFiltered = await request(app).get("/api/tasks?tag=shopping").expect(200);
    expect(tagFiltered.body.tasks).toHaveLength(1);
    expect(tagFiltered.body.tasks[0].title).toBe("Buy coffee");

    const searchFiltered = await request(app).get("/api/tasks?search=interview").expect(200);
    expect(searchFiltered.body.tasks).toHaveLength(1);
    expect(searchFiltered.body.tasks[0].title).toBe("Write interview notes");

    const completedFiltered = await request(app).get("/api/tasks?completed=false").expect(200);
    expect(completedFiltered.body.tasks).toHaveLength(2);

    const tags = await request(app).get("/api/tasks/tags").expect(200);
    expect(tags.body).toEqual({ tags: ["errands", "shopping", "work"] });
  });

  it("adds deterministic AI tags without duplicating manual tags", async () => {
    const app = testApp();

    const inferred = await request(app)
      .post("/api/tasks")
      .send({ title: "Prepare interview presentation", description: "Review architecture notes" })
      .expect(201);

    expect(inferred.body.task.tags).toEqual([{ name: "work", source: "ai", confidence: 0.85 }]);

    const manualOverride = await request(app)
      .post("/api/tasks")
      .send({ title: "Prepare interview presentation", tags: ["Work"] })
      .expect(201);

    expect(manualOverride.body.task.tags).toEqual([{ name: "work", source: "manual", confidence: null }]);
  });

  it("replaces AI tags with manual tags when editing", async () => {
    const app = testApp();

    const created = await request(app)
      .post("/api/tasks")
      .send({ title: "Prepare interview presentation", description: "Review architecture notes" })
      .expect(201);

    expect(created.body.task.tags).toEqual([{ name: "work", source: "ai", confidence: 0.85 }]);

    const updated = await request(app)
      .patch(`/api/tasks/${created.body.task.id}`)
      .send({ tags: ["follow-up"] })
      .expect(200);

    expect(updated.body.task.tags).toEqual([{ name: "follow-up", source: "manual", confidence: null }]);
  });

  it("paginates task lists with 20 items by default", async () => {
    const app = testApp();

    for (let index = 1; index <= 21; index += 1) {
      await request(app).post("/api/tasks").send({ title: `Task ${index}` }).expect(201);
    }

    const firstPage = await request(app).get("/api/tasks").expect(200);
    expect(firstPage.body.tasks).toHaveLength(20);
    expect(firstPage.body).toMatchObject({
      total: 21,
      page: 1,
      pageSize: 20,
      totalPages: 2,
    });

    const secondPage = await request(app).get("/api/tasks?page=2").expect(200);
    expect(secondPage.body.tasks).toHaveLength(1);
    expect(secondPage.body.page).toBe(2);
  });

  it("rejects oversized page sizes", async () => {
    const app = testApp();

    const response = await request(app).get("/api/tasks?pageSize=101").expect(400);

    expect(response.body).toEqual({ error: "pageSize must be at most 100" });
  });

  it("rejects too many tags", async () => {
    const app = testApp();

    const response = await request(app)
      .post("/api/tasks")
      .send({ title: "Too many tags", tags: Array.from({ length: 21 }, (_, index) => `tag-${index}`) })
      .expect(400);

    expect(response.body.error).toBe("tags must contain at most 20 items");
  });

  it("rejects blank task titles", async () => {
    const app = testApp();

    const response = await request(app).post("/api/tasks").send({ title: "   " }).expect(400);
    expect(response.body.error).toBe("title is required");
  });

  it("returns 400 for malformed JSON", async () => {
    const app = testApp();

    const response = await request(app)
      .post("/api/tasks")
      .set("Content-Type", "application/json")
      .send('{"title":')
      .expect(400);

    expect(response.body.error).toBe("Malformed JSON request body");
  });
});
