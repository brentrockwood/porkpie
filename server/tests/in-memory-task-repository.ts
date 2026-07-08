import type { Task } from "@porkpie/shared";
import type { NewTask, PagedTasks, TaskFilters, TaskPatch, TaskRepository } from "../src/tasks/task-repository.js";

export class InMemoryTaskRepository implements TaskRepository {
  private readonly tasks = new Map<string, Task & { userId: string }>();

  async list(userId: string, filters: TaskFilters): Promise<PagedTasks> {
    const filtered = [...this.tasks.values()]
      .filter((task) => task.userId === userId)
      .filter((task) => filters.completed === undefined || task.completed === filters.completed)
      .filter((task) => !filters.tag || task.tags.some((tag) => tag.name === filters.tag))
      .filter((task) => !filters.search || matchesSearch(task, filters.search))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id))
      .map(stripUserId);

    const start = (filters.page - 1) * filters.pageSize;
    return {
      tasks: filtered.slice(start, start + filters.pageSize),
      total: filtered.length,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.max(1, Math.ceil(filtered.length / filters.pageSize)),
    };
  }

  async listTags(userId: string): Promise<string[]> {
    const tags = [...this.tasks.values()]
      .filter((task) => task.userId === userId)
      .flatMap((task) => task.tags.map((tag) => tag.name));
    return [...new Set(tags)].sort();
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
      tags: normalizeTags(task.tags, task.aiTags),
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
      title: patch.title ?? existing.title,
      description: patch.description !== undefined ? patch.description : existing.description,
      completed: patch.completed ?? existing.completed,
      tags: patch.tags === undefined ? existing.tags : normalizeTags(patch.tags, existing.tags.flatMap((tag) => (tag.source === "ai" && tag.confidence !== null ? [{ name: tag.name, confidence: tag.confidence }] : []))),
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

function normalizeTags(names: string[], aiTags: { name: string; confidence: number }[] = []): Task["tags"] {
  const manualTags = [...new Set(names)].sort().map((name) => ({ name, source: "manual" as const, confidence: null }));
  const manualNames = new Set(manualTags.map((tag) => tag.name));
  const inferredTags = aiTags
    .filter((tag) => !manualNames.has(tag.name))
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((tag) => ({ name: tag.name, source: "ai" as const, confidence: tag.confidence }));

  return [...manualTags, ...inferredTags].sort((left, right) => left.name.localeCompare(right.name));
}

function matchesSearch(task: Task, search: string): boolean {
  const normalized = search.toLowerCase();
  return task.title.toLowerCase().includes(normalized) || (task.description?.toLowerCase().includes(normalized) ?? false);
}
