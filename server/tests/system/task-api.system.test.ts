import type { Pool } from "pg";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { createPool } from "../../src/db/pool.js";
import { runMigrations } from "../../src/db/migrate.js";
import { PostgresTaskRepository } from "../../src/tasks/task-repository.js";
import { TaskService } from "../../src/tasks/task-service.js";

const databaseUrl = process.env.SYSTEM_DATABASE_URL;
const describeSystem = databaseUrl ? describe : describe.skip;

describeSystem("task API system test", () => {
  let pool: Pool;

  beforeAll(async () => {
    await runMigrations(databaseUrl!);
    pool = createPool(databaseUrl!);
    await pool.query("TRUNCATE tasks CASCADE");
  });

  afterAll(async () => {
    await pool.query("TRUNCATE tasks CASCADE");
    await pool.end();
  });

  it("persists a full task lifecycle through PostgreSQL", async () => {
    const app = createApp(new TaskService(new PostgresTaskRepository(pool)));

    const created = await request(app)
      .post("/api/tasks")
      .send({ title: "Schedule architecture review", description: "Walk through REST and Postgres choices" })
      .expect(201);

    const id = created.body.task.id;
    expect(id).toEqual(expect.any(String));
    expect(created.body.task).toMatchObject({
      title: "Schedule architecture review",
      description: "Walk through REST and Postgres choices",
      completed: false,
    });

    const rowAfterCreate = await pool.query("SELECT title, description, completed FROM tasks WHERE id = $1", [id]);
    expect(rowAfterCreate.rows).toEqual([
      {
        title: "Schedule architecture review",
        description: "Walk through REST and Postgres choices",
        completed: false,
      },
    ]);

    const fetched = await request(app).get(`/api/tasks/${id}`).expect(200);
    expect(fetched.body.task.id).toBe(id);

    const updated = await request(app)
      .patch(`/api/tasks/${id}`)
      .send({ title: "Finish architecture review", completed: true })
      .expect(200);

    expect(updated.body.task).toMatchObject({
      id,
      title: "Finish architecture review",
      completed: true,
    });

    const listed = await request(app).get("/api/tasks").expect(200);
    expect(listed.body.tasks).toHaveLength(1);
    expect(listed.body.tasks[0].id).toBe(id);

    await request(app).delete(`/api/tasks/${id}`).expect(204);
    await request(app).get(`/api/tasks/${id}`).expect(404);

    const rowAfterDelete = await pool.query("SELECT id FROM tasks WHERE id = $1", [id]);
    expect(rowAfterDelete.rowCount).toBe(0);
  });

  it("persists tags and supports search/filtering", async () => {
    const app = createApp(new TaskService(new PostgresTaskRepository(pool)));

    const created = await request(app)
      .post("/api/tasks")
      .send({ title: "Buy coffee", description: "Whole bean", tags: ["Shopping", "Errands", "shopping"] })
      .expect(201);

    expect(created.body.task.tags).toEqual([
      { name: "errands", source: "manual", confidence: null },
      { name: "shopping", source: "manual", confidence: null },
    ]);

    await request(app).post("/api/tasks").send({ title: "Write interview notes", tags: ["work"] }).expect(201);

    const tagFiltered = await request(app).get("/api/tasks?tag=shopping").expect(200);
    expect(tagFiltered.body.tasks).toHaveLength(1);
    expect(tagFiltered.body.tasks[0].title).toBe("Buy coffee");

    const searchFiltered = await request(app).get("/api/tasks?search=interview").expect(200);
    expect(searchFiltered.body.tasks).toHaveLength(1);
    expect(searchFiltered.body.tasks[0].title).toBe("Write interview notes");

    const literalWildcardSearch = await request(app).get("/api/tasks?search=%25").expect(200);
    expect(literalWildcardSearch.body.tasks).toHaveLength(0);

    await request(app).patch(`/api/tasks/${created.body.task.id}`).send({ tags: ["grocery"] }).expect(200);

    const updatedTagFiltered = await request(app).get("/api/tasks?tag=grocery").expect(200);
    expect(updatedTagFiltered.body.tasks).toHaveLength(1);
    expect(updatedTagFiltered.body.tasks[0].tags).toEqual([
      { name: "grocery", source: "manual", confidence: null },
    ]);
  });

  it("updates only provided fields and can clear description", async () => {
    const app = createApp(new TaskService(new PostgresTaskRepository(pool)));

    const created = await request(app)
      .post("/api/tasks")
      .send({ title: "Preserve description", description: "Keep this" })
      .expect(201);

    const id = created.body.task.id;

    const completedOnly = await request(app).patch(`/api/tasks/${id}`).send({ completed: true }).expect(200);
    expect(completedOnly.body.task).toMatchObject({
      title: "Preserve description",
      description: "Keep this",
      completed: true,
    });

    const cleared = await request(app).patch(`/api/tasks/${id}`).send({ description: null }).expect(200);
    expect(cleared.body.task).toMatchObject({
      title: "Preserve description",
      description: null,
      completed: true,
    });
  });

  it("returns validation errors before writing invalid tasks", async () => {
    const app = createApp(new TaskService(new PostgresTaskRepository(pool)));

    const before = await pool.query("SELECT count(*)::int AS count FROM tasks");

    await request(app).post("/api/tasks").send({ title: "" }).expect(400);

    const after = await pool.query("SELECT count(*)::int AS count FROM tasks");
    expect(after.rows[0].count).toBe(before.rows[0].count);
  });
});
