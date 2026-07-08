import { Router } from "express";
import { demoAuthContext } from "../auth/auth-context.js";
import { asyncHandler } from "../http/async-handler.js";
import { ValidationError } from "./task-service.js";
import type { TaskService } from "./task-service.js";
import type { TaskFilters } from "./task-repository.js";

const MAX_PAGE_SIZE = 100;

export function createTaskRouter(taskService: TaskService): Router {
  const router = Router();

  router.get(
    "/",
    asyncHandler(async (request, response) => {
      const result = await taskService.listTasks(demoAuthContext, parseFilters(request.query));
      response.json(result);
    }),
  );

  router.get(
    "/tags",
    asyncHandler(async (_request, response) => {
      const tags = await taskService.listTags(demoAuthContext);
      response.json({ tags });
    }),
  );

  router.post(
    "/",
    asyncHandler(async (request, response) => {
      const task = await taskService.createTask(demoAuthContext, request.body);
      response.status(201).json({ task });
    }),
  );

  router.get(
    "/:id",
    asyncHandler(async (request, response) => {
      const task = await taskService.getTask(demoAuthContext, String(request.params.id));
      if (!task) {
        response.status(404).json({ error: "Task not found" });
        return;
      }
      response.json({ task });
    }),
  );

  router.patch(
    "/:id",
    asyncHandler(async (request, response) => {
      const task = await taskService.updateTask(demoAuthContext, String(request.params.id), request.body);
      if (!task) {
        response.status(404).json({ error: "Task not found" });
        return;
      }
      response.json({ task });
    }),
  );

  router.delete(
    "/:id",
    asyncHandler(async (request, response) => {
      const deleted = await taskService.deleteTask(demoAuthContext, String(request.params.id));
      if (!deleted) {
        response.status(404).json({ error: "Task not found" });
        return;
      }
      response.status(204).send();
    }),
  );

  return router;
}

function parseFilters(query: Record<string, unknown>): TaskFilters {
  const filters: TaskFilters = { page: 1, pageSize: 20 };

  if (query.completed !== undefined) {
    if (query.completed === "true") filters.completed = true;
    else if (query.completed === "false") filters.completed = false;
    else throw new ValidationError("completed filter must be true or false");
  }

  if (typeof query.tag === "string" && query.tag.trim()) {
    filters.tag = query.tag.trim().toLowerCase();
  }

  if (typeof query.search === "string" && query.search.trim()) {
    filters.search = query.search.trim();
  }

  if (query.page !== undefined) {
    filters.page = parsePositiveInteger(query.page, "page");
  }

  if (query.pageSize !== undefined) {
    filters.pageSize = parseBoundedPageSize(query.pageSize);
  }

  return filters;
}

function parsePositiveInteger(value: unknown, name: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new ValidationError(`${name} must be a positive integer`);
  }
  return parsed;
}

function parseBoundedPageSize(value: unknown): number {
  const parsed = parsePositiveInteger(value, "pageSize");
  if (parsed > MAX_PAGE_SIZE) {
    throw new ValidationError(`pageSize must be at most ${MAX_PAGE_SIZE}`);
  }
  return parsed;
}
