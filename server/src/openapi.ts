export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Porkpie API",
    version: "0.1.0",
    description: "REST API for the Porkpie task application.",
  },
  servers: [{ url: "http://localhost:4000" }],
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        responses: {
          "200": {
            description: "API is healthy",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" },
              },
            },
          },
        },
      },
    },
    "/api/tasks": {
      get: {
        summary: "List tasks",
        responses: {
          "200": {
            description: "Tasks for the current user",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TaskListResponse" },
              },
            },
          },
        },
      },
      post: {
        summary: "Create a task",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateTaskRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Created task",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TaskResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
        },
      },
    },
    "/api/tasks/{id}": {
      get: {
        summary: "Get a task",
        parameters: [{ $ref: "#/components/parameters/TaskId" }],
        responses: {
          "200": {
            description: "Task",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TaskResponse" },
              },
            },
          },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      patch: {
        summary: "Update a task",
        parameters: [{ $ref: "#/components/parameters/TaskId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateTaskRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated task",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TaskResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        summary: "Delete a task",
        parameters: [{ $ref: "#/components/parameters/TaskId" }],
        responses: {
          "204": { description: "Task deleted" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
  },
  components: {
    parameters: {
      TaskId: {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    },
    responses: {
      ValidationError: {
        description: "Invalid request",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      NotFound: {
        description: "Task not found",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
    },
    schemas: {
      HealthResponse: {
        type: "object",
        required: ["ok"],
        properties: {
          ok: { type: "boolean" },
        },
      },
      Task: {
        type: "object",
        required: ["id", "title", "description", "completed", "createdAt", "updatedAt"],
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string", minLength: 1 },
          description: { type: ["string", "null"] },
          completed: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CreateTaskRequest: {
        type: "object",
        required: ["title"],
        properties: {
          title: { type: "string", minLength: 1 },
          description: { type: ["string", "null"] },
        },
      },
      UpdateTaskRequest: {
        type: "object",
        properties: {
          title: { type: "string", minLength: 1 },
          description: { type: ["string", "null"] },
          completed: { type: "boolean" },
        },
      },
      TaskResponse: {
        type: "object",
        required: ["task"],
        properties: {
          task: { $ref: "#/components/schemas/Task" },
        },
      },
      TaskListResponse: {
        type: "object",
        required: ["tasks"],
        properties: {
          tasks: {
            type: "array",
            items: { $ref: "#/components/schemas/Task" },
          },
        },
      },
      ErrorResponse: {
        type: "object",
        required: ["error"],
        properties: {
          error: { type: "string" },
        },
      },
    },
  },
} as const;
