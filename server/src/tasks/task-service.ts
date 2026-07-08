import { randomUUID } from "node:crypto";
import type { CreateTaskRequest, Task, UpdateTaskRequest } from "@porkpie/shared";
import type { AuthContext } from "../auth/auth-context.js";
import { HeuristicTaskClassifier, type TaskClassifier } from "./task-classifier.js";
import type { PagedTasks, TaskFilters, TaskRepository } from "./task-repository.js";

export class ValidationError extends Error {}

export class TaskService {
  constructor(
    private readonly repository: TaskRepository,
    private readonly classifier: TaskClassifier = new HeuristicTaskClassifier(),
  ) {}

  listTasks(auth: AuthContext, filters: TaskFilters): Promise<PagedTasks> {
    return this.repository.list(auth.userId, filters);
  }

  listTags(auth: AuthContext): Promise<string[]> {
    return this.repository.listTags(auth.userId);
  }

  getTask(auth: AuthContext, id: string): Promise<Task | null> {
    return this.repository.findById(auth.userId, id);
  }

  async createTask(auth: AuthContext, input: CreateTaskRequest): Promise<Task> {
    const title = normalizeTitle(input.title);

    const description = normalizeDescription(input.description);
    const tags = normalizeTags(input.tags);

    return this.repository.create({
      id: randomUUID(),
      userId: auth.userId,
      title,
      description,
      tags,
      aiTags: await this.classifier.classify({ title, description, manualTags: tags }),
    });
  }

  updateTask(auth: AuthContext, id: string, input: UpdateTaskRequest): Promise<Task | null> {
    const patch: UpdateTaskRequest = {};

    if (input.title !== undefined) {
      patch.title = normalizeTitle(input.title);
    }

    if (input.description !== undefined) {
      patch.description = normalizeDescription(input.description);
    }

    if (input.completed !== undefined) {
      if (typeof input.completed !== "boolean") {
        throw new ValidationError("completed must be a boolean");
      }
      patch.completed = input.completed;
    }

    if (input.tags !== undefined) {
      patch.tags = normalizeTags(input.tags);
    }

    return this.repository.update(auth.userId, id, patch);
  }

  deleteTask(auth: AuthContext, id: string): Promise<boolean> {
    return this.repository.delete(auth.userId, id);
  }
}

function normalizeTitle(value: unknown): string {
  if (typeof value !== "string") {
    throw new ValidationError("title is required");
  }

  const title = value.trim();
  if (!title) {
    throw new ValidationError("title is required");
  }

  return title;
}

function normalizeDescription(value: unknown): string | null {
  if (value === undefined || value === null) return null;

  if (typeof value !== "string") {
    throw new ValidationError("description must be a string");
  }

  const description = value.trim();
  return description || null;
}

function normalizeTags(value: unknown): string[] {
  if (value === undefined) return [];

  if (!Array.isArray(value)) {
    throw new ValidationError("tags must be an array");
  }

  if (value.length > 20) {
    throw new ValidationError("tags must contain at most 20 items");
  }

  const tags = value.map((tag) => {
    if (typeof tag !== "string") {
      throw new ValidationError("tags must contain strings");
    }
    return tag.trim().toLowerCase();
  }).filter(Boolean);

  return [...new Set(tags)];
}
