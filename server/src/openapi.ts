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
        parameters: [
          { $ref: "#/components/parameters/SearchFilter" },
          { $ref: "#/components/parameters/TagFilter" },
          { $ref: "#/components/parameters/CompletedFilter" },
          { $ref: "#/components/parameters/Page" },
          { $ref: "#/components/parameters/PageSize" },
        ],
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
    "/api/tasks/tags": {
      get: {
        summary: "List task tags",
        responses: {
          "200": {
            description: "Known task tags for the current user",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TagListResponse" },
              },
            },
          },
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
      SearchFilter: {
        name: "search",
        in: "query",
        required: false,
        schema: { type: "string" },
      },
      TagFilter: {
        name: "tag",
        in: "query",
        required: false,
        schema: { type: "string" },
      },
      CompletedFilter: {
        name: "completed",
        in: "query",
        required: false,
        schema: { type: "boolean" },
      },
      Page: {
        name: "page",
        in: "query",
        required: false,
        schema: { type: "integer", minimum: 1, default: 1 },
      },
      PageSize: {
        name: "pageSize",
        in: "query",
        required: false,
        schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
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
      TaskTag: {
        type: "object",
        required: ["name", "source", "confidence"],
        properties: {
          name: { type: "string" },
          source: { type: "string", enum: ["manual", "ai"], description: "manual for user-entered tags, ai for deterministic classifier tags." },
          confidence: { type: ["number", "null"], minimum: 0, maximum: 1, description: "Classifier confidence for ai tags; null for manual tags." },
        },
      },
      Task: {
        type: "object",
        required: ["id", "title", "description", "completed", "tags", "createdAt", "updatedAt"],
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string", minLength: 1 },
          description: { type: ["string", "null"] },
          completed: { type: "boolean" },
          tags: { type: "array", items: { $ref: "#/components/schemas/TaskTag" } },
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
          tags: { type: "array", items: { type: "string" }, description: "Manual tags. The server may add non-duplicative classifier tags with source=ai." },
        },
      },
      UpdateTaskRequest: {
        type: "object",
        properties: {
          title: { type: "string", minLength: 1 },
          description: { type: ["string", "null"] },
          completed: { type: "boolean" },
          tags: { type: "array", items: { type: "string" } },
        },
      },
      TaskResponse: {
        type: "object",
        required: ["task"],
        properties: {
          task: { $ref: "#/components/schemas/Task" },
        },
      },
      TagListResponse: {
        type: "object",
        required: ["tags"],
        properties: {
          tags: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
      TaskListResponse: {
        type: "object",
        required: ["tasks", "total", "page", "pageSize", "totalPages"],
        properties: {
          tasks: {
            type: "array",
            items: { $ref: "#/components/schemas/Task" },
          },
          total: { type: "integer", minimum: 0 },
          page: { type: "integer", minimum: 1 },
          pageSize: { type: "integer", minimum: 1, maximum: 100 },
          totalPages: { type: "integer", minimum: 1 },
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
