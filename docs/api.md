# API Overview

Base URL in local development: `http://localhost:4000`.

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

### Create task

```text
POST /api/tasks
```

Body:

```json
{
  "title": "Buy milk",
  "description": "Optional details"
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
  "completed": true
}
```

### Delete task

```text
DELETE /api/tasks/:id
```

Returns `204 No Content` on success.
