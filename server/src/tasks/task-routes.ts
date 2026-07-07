import { Router } from "express";
import { demoAuthContext } from "../auth/auth-context.js";
import { asyncHandler } from "../http/async-handler.js";
import type { TaskService } from "./task-service.js";

export function createTaskRouter(taskService: TaskService): Router {
  const router = Router();

  router.get(
    "/",
    asyncHandler(async (_request, response) => {
      const tasks = await taskService.listTasks(demoAuthContext);
      response.json({ tasks });
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
