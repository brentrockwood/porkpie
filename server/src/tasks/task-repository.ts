import type { Pool } from "pg";
import type { Task } from "@porkpie/shared";

export type NewTask = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
};

export type TaskPatch = {
  title?: string;
  description?: string | null;
  completed?: boolean;
};

export interface TaskRepository {
  list(userId: string): Promise<Task[]>;
  findById(userId: string, id: string): Promise<Task | null>;
  create(task: NewTask): Promise<Task>;
  update(userId: string, id: string, patch: TaskPatch): Promise<Task | null>;
  delete(userId: string, id: string): Promise<boolean>;
}

function rowToTask(row: Record<string, unknown>): Task {
  return {
    id: String(row.id),
    title: String(row.title),
    description: row.description === null ? null : String(row.description),
    completed: Boolean(row.completed),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export class PostgresTaskRepository implements TaskRepository {
  constructor(private readonly pool: Pool) {}

  async list(userId: string): Promise<Task[]> {
    const result = await this.pool.query(
      "SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC",
      [userId],
    );
    return result.rows.map(rowToTask);
  }

  async findById(userId: string, id: string): Promise<Task | null> {
    const result = await this.pool.query("SELECT * FROM tasks WHERE user_id = $1 AND id = $2", [userId, id]);
    return result.rows[0] ? rowToTask(result.rows[0]) : null;
  }

  async create(task: NewTask): Promise<Task> {
    const result = await this.pool.query(
      `INSERT INTO tasks (id, user_id, title, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [task.id, task.userId, task.title, task.description],
    );
    return rowToTask(result.rows[0]);
  }

  async update(userId: string, id: string, patch: TaskPatch): Promise<Task | null> {
    const result = await this.pool.query(
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

    return result.rows[0] ? rowToTask(result.rows[0]) : null;
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const result = await this.pool.query("DELETE FROM tasks WHERE user_id = $1 AND id = $2", [userId, id]);
    return (result.rowCount ?? 0) > 0;
  }
}
