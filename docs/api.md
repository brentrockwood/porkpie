# API Overview

Base URL in local development: `http://localhost:4000`.

Interactive Swagger UI is available at `/docs`. The raw OpenAPI contract is available at `/openapi.json`.

## Health

```text
GET /health
```

Response:

```json
{ "ok": true }
```

## Tasks

### List tasks

```text
GET /api/tasks
```

Optional query parameters:

```text
search=milk
tag=shopping
completed=true|false
```

### Create task

```text
POST /api/tasks
```

Body:

```json
{
  "title": "Buy milk",
  "description": "Optional details",
  "tags": ["shopping", "grocery"]
}
```

### Get task

```text
GET /api/tasks/:id
```

### Update task

```text
PATCH /api/tasks/:id
```

Body fields are optional:

```json
{
  "title": "Buy oat milk",
  "description": null,
  "completed": true,
  "tags": ["shopping"]
}
```

### Delete task

```text
DELETE /api/tasks/:id
```

Returns `204 No Content` on success.
