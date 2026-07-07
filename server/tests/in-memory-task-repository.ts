import type { Task } from "@porkpie/shared";
import type { NewTask, TaskPatch, TaskRepository } from "../src/tasks/task-repository.js";

export class InMemoryTaskRepository implements TaskRepository {
  private readonly tasks = new Map<string, Task & { userId: string }>();

  async list(userId: string): Promise<Task[]> {
    return [...this.tasks.values()]
      .filter((task) => task.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(stripUserId);
  }

  async findById(userId: string, id: string): Promise<Task | null> {
    const task = this.tasks.get(id);
    return task && task.userId === userId ? stripUserId(task) : null;
  }

  async create(task: NewTask): Promise<Task> {
    const now = new Date().toISOString();
    const created = {
      id: task.id,
      userId: task.userId,
      title: task.title,
      description: task.description,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.set(task.id, created);
    return stripUserId(created);
  }

  async update(userId: string, id: string, patch: TaskPatch): Promise<Task | null> {
    const existing = this.tasks.get(id);
    if (!existing || existing.userId !== userId) return null;

    const updated = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    this.tasks.set(id, updated);
    return stripUserId(updated);
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const existing = this.tasks.get(id);
    if (!existing || existing.userId !== userId) return false;
    return this.tasks.delete(id);
  }
}

function stripUserId(task: Task & { userId: string }): Task {
  const { userId: _userId, ...rest } = task;
  return rest;
}
