# Porkpie

Porkpie is a small full-stack task app for a live technical craft interview walkthrough. Phase 1 focuses on end-to-end CRUD with React, Express, TypeScript, PostgreSQL, and Docker Compose.

## Prerequisites

- Node.js 22+
- npm
- Docker / Docker Compose

## Local development

Install dependencies:

```sh
npm install
```

Start Postgres:

```sh
docker compose up postgres
```

Run migrations:

```sh
cp server/.env.example server/.env
npm run migrate -w @porkpie/server
```

Start the API:

```sh
npm run dev -w @porkpie/server
```

Start the client in another shell:

```sh
cp client/.env.example client/.env
npm run dev -w @porkpie/client
```

Open <http://localhost:5173>.

## Docker Compose app stack

You can also run the local stack with:

```sh
docker compose up
```

The API will be available at <http://localhost:4000> and the client at <http://localhost:5173>.

## Tests

```sh
npm test
```

## Useful commands

```sh
npm run typecheck
npm run build
npm run migrate -w @porkpie/server
```

## Phase 1 API

```text
GET    /health
GET    /api/tasks
POST   /api/tasks
GET    /api/tasks/:id
PATCH  /api/tasks/:id
DELETE /api/tasks/:id
```
