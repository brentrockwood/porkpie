import { randomUUID } from "node:crypto";
import type { Pool, PoolClient, QueryResult } from "pg";
import type { Task, TaskTag } from "@porkpie/shared";
import type { ClassifiedTaskTag } from "./task-classifier.js";

export type TaskFilters = {
  completed?: boolean;
  tag?: string;
  search?: string;
  page: number;
  pageSize: number;
};

export type PagedTasks = {
  tasks: Task[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type NewTask = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  tags: string[];
  aiTags: ClassifiedTaskTag[];
};

export type TaskPatch = {
  title?: string;
  description?: string | null;
  completed?: boolean;
  tags?: string[];
};

export interface TaskRepository {
  list(userId: string, filters: TaskFilters): Promise<PagedTasks>;
  listTags(userId: string): Promise<string[]>;
  findById(userId: string, id: string): Promise<Task | null>;
  create(task: NewTask): Promise<Task>;
  update(userId: string, id: string, patch: TaskPatch): Promise<Task | null>;
  delete(userId: string, id: string): Promise<boolean>;
}

type Queryable = {
  query(sql: string, values?: unknown[]): Promise<QueryResult>;
};

function rowToTask(row: Record<string, unknown>, tags: TaskTag[] = []): Task {
  return {
    id: String(row.id),
    title: String(row.title),
    description: row.description === null ? null : String(row.description),
    completed: Boolean(row.completed),
    tags,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  };
}

function toIsoString(value: unknown): string {
  return value instanceof Date ? value.toISOString() : new Date(String(value)).toISOString();
}

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

export class PostgresTaskRepository implements TaskRepository {
  constructor(private readonly pool: Pool) {}

  async list(userId: string, filters: TaskFilters): Promise<PagedTasks> {
    const values: unknown[] = [userId];
    const where = ["tasks.user_id = $1"];

    if (filters.completed !== undefined) {
      values.push(filters.completed);
      where.push(`tasks.completed = $${values.length}`);
    }

    if (filters.search) {
      values.push(`%${escapeLikePattern(filters.search)}%`);
      where.push(`(tasks.title ILIKE $${values.length} ESCAPE '\\' OR tasks.description ILIKE $${values.length} ESCAPE '\\')`);
    }

    if (filters.tag) {
      values.push(filters.tag);
      where.push(`EXISTS (
        SELECT 1
        FROM task_tags
        JOIN tags ON tags.id = task_tags.tag_id
        WHERE task_tags.task_id = tasks.id AND tags.name = $${values.length}
      )`);
    }

    const countResult = await this.pool.query(
      `SELECT count(*)::int AS total FROM tasks
       WHERE ${where.join(" AND ")}`,
      values,
    );

    values.push(filters.pageSize, (filters.page - 1) * filters.pageSize);
    const result = await this.pool.query(
      `SELECT tasks.* FROM tasks
       WHERE ${where.join(" AND ")}
       ORDER BY tasks.created_at DESC, tasks.id DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values,
    );

    const total = Number(countResult.rows[0]?.total ?? 0);
    return {
      tasks: await this.attachTags(result.rows),
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
    };
  }

  async listTags(userId: string): Promise<string[]> {
    const result = await this.pool.query(
      `SELECT DISTINCT tags.name
       FROM tags
       JOIN task_tags ON task_tags.tag_id = tags.id
       JOIN tasks ON tasks.id = task_tags.task_id
       WHERE tasks.user_id = $1
       ORDER BY tags.name`,
      [userId],
    );
    return result.rows.map((row) => String(row.name));
  }

  async findById(userId: string, id: string): Promise<Task | null> {
    const result = await this.pool.query("SELECT * FROM tasks WHERE user_id = $1 AND id = $2", [userId, id]);
    if (!result.rows[0]) return null;

    const tags = await loadTagsForTasks(this.pool, [id]);
    return rowToTask(result.rows[0], tags.get(id) ?? []);
  }

  async create(task: NewTask): Promise<Task> {
    return this.withClient(async (client) => {
      const result = await client.query(
        `INSERT INTO tasks (id, user_id, title, description)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [task.id, task.userId, task.title, task.description],
      );

      await replaceManualTags(client, task.id, task.tags);
      await replaceAiTags(client, task.id, task.aiTags);
      const tags = await loadTagsForTasks(client, [task.id]);
      return rowToTask(result.rows[0], tags.get(task.id) ?? []);
    });
  }

  async update(userId: string, id: string, patch: TaskPatch): Promise<Task | null> {
    return this.withClient(async (client) => {
      const result = await client.query(
        `UPDATE tasks
         SET title = COALESCE($3, title),
             description = CASE WHEN $4 THEN $5 ELSE description END,
             completed = COALESCE($6, completed),
             updated_at = now()
         WHERE user_id = $1 AND id = $2
         RETURNING *`,
        [
          userId,
          id,
          patch.title ?? null,
          patch.description !== undefined,
          patch.description ?? null,
          patch.completed ?? null,
        ],
      );

      if (!result.rows[0]) return null;

      if (patch.tags !== undefined) {
        await replaceManualTags(client, id, patch.tags);
      }

      const tags = await loadTagsForTasks(client, [id]);
      return rowToTask(result.rows[0], tags.get(id) ?? []);
    });
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const result = await this.pool.query("DELETE FROM tasks WHERE user_id = $1 AND id = $2", [userId, id]);
    return (result.rowCount ?? 0) > 0;
  }

  private async attachTags(rows: Record<string, unknown>[]): Promise<Task[]> {
    const ids = rows.map((row) => String(row.id));
    const tags = await loadTagsForTasks(this.pool, ids);
    return rows.map((row) => rowToTask(row, tags.get(String(row.id)) ?? []));
  }

  private async withClient<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

async function loadTagsForTasks(db: Queryable, taskIds: string[]): Promise<Map<string, TaskTag[]>> {
  const tags = new Map<string, TaskTag[]>();
  if (taskIds.length === 0) return tags;

  const result = await db.query(
    `SELECT task_tags.task_id, tags.name, task_tags.source, task_tags.confidence
     FROM task_tags
     JOIN tags ON tags.id = task_tags.tag_id
     WHERE task_tags.task_id = ANY($1::uuid[])
     ORDER BY tags.name`,
    [taskIds],
  );

  for (const row of result.rows) {
    const taskId = String(row.task_id);
    const existing = tags.get(taskId) ?? [];
    existing.push({
      name: String(row.name),
      source: row.source === "ai" ? "ai" : "manual",
      confidence: row.confidence === null ? null : Number(row.confidence),
    });
    tags.set(taskId, existing);
  }

  return tags;
}

async function replaceManualTags(db: Queryable, taskId: string, names: string[]): Promise<void> {
  await db.query("DELETE FROM task_tags WHERE task_id = $1 AND source = 'manual'", [taskId]);
  if (names.length === 0) return;

  const tagIds = await upsertTags(db, names);
  await db.query(
    `INSERT INTO task_tags (task_id, tag_id, source, confidence)
     SELECT $1, unnest($2::uuid[]), 'manual', NULL
     ON CONFLICT DO NOTHING`,
    [taskId, tagIds],
  );
}

async function replaceAiTags(db: Queryable, taskId: string, tags: ClassifiedTaskTag[]): Promise<void> {
  await db.query("DELETE FROM task_tags WHERE task_id = $1 AND source = 'ai'", [taskId]);
  if (tags.length === 0) return;

  const tagIds = await upsertTags(db, tags.map((tag) => tag.name));
  await db.query(
    `INSERT INTO task_tags (task_id, tag_id, source, confidence)
     SELECT $1, unnest($2::uuid[]), 'ai', unnest($3::numeric[])
     ON CONFLICT DO NOTHING`,
    [taskId, tagIds, tags.map((tag) => tag.confidence)],
  );
}

async function upsertTags(db: Queryable, names: string[]): Promise<string[]> {
  const ids = names.map(() => randomUUID());
  const tagResult = await db.query(
    `INSERT INTO tags (id, name)
     SELECT unnest($1::uuid[]), unnest($2::text[])
     ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
     RETURNING id, name`,
    [ids, names],
  );

  const idsByName = new Map(tagResult.rows.map((row) => [String(row.name), String(row.id)]));
  return names.map((name) => idsByName.get(name)).filter((id): id is string => id !== undefined);
}
