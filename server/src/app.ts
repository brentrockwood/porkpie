import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "./openapi.js";
import { ValidationError } from "./tasks/task-service.js";
import { createTaskRouter } from "./tasks/task-routes.js";
import type { TaskService } from "./tasks/task-service.js";

export function createApp(taskService: TaskService, clientOrigin = "http://localhost:5173") {
  const app = express();

  app.use(cors({ origin: clientOrigin }));
  app.use(express.json());

  app.use((request, _response, next) => {
    console.log(`${request.method} ${request.path}`);
    next();
  });

  app.get("/health", (_request, response) => {
    response.json({ ok: true });
  });

  app.get("/openapi.json", (_request, response) => {
    response.json(openApiDocument);
  });

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
  app.use("/api/tasks", createTaskRouter(taskService));

  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    if (error instanceof ValidationError) {
      response.status(400).json({ error: error.message });
      return;
    }

    console.error(error);
    response.status(500).json({ error: "Internal server error" });
  });

  return app;
}
