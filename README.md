# Porkpie

Porkpie is a small full-stack task app for a live technical craft interview walkthrough. Phase 1 focuses on end-to-end CRUD with React, Express, TypeScript, PostgreSQL, and Docker Compose.

## Prerequisites

- Node.js 22+
- npm
- Docker / Docker Compose

## Local development

Install dependencies and create local env files:

```sh
npm install
cp .env.example .env
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Edit `.env` and `server/.env` with local database credentials. Do not commit those files.

Start Postgres:

```sh
docker compose up postgres
```

Run migrations:

```sh
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
docker compose up --build
```

The API will be available at <http://localhost:4000> and the client at <http://localhost:5173>.

API documentation is available at <http://localhost:4000/docs>, with the raw OpenAPI contract at <http://localhost:4000/openapi.json>.

The compose stack uses a small local Node development image with current npm and a Chainguard Postgres image to keep fixable high/critical container vulnerabilities out of the demo runtime. If switching from the earlier Postgres 16 image, reset the local database volume once:

```sh
docker compose down -v
```

## Tests

Fast API tests use an in-memory repository and do not require Docker:

```sh
npm test
```

Database-backed system tests run against PostgreSQL:

```sh
docker compose up -d postgres
SYSTEM_DATABASE_URL="$DATABASE_URL" npm run test:system
```

Browser smoke tests use `agent-browser` against the running app:

```sh
npm install -g agent-browser
docker compose up -d --build
npm run test:e2e
```

Container vulnerability scan for fixable high/critical findings:

```sh
npm run scan:containers
```

## Useful commands

```sh
npm run lint
npm run typecheck
npm run build
npm run migrate -w @porkpie/server
```

## Phase 1 API

```text
GET    /health
GET    /openapi.json
GET    /docs
GET    /api/tasks
POST   /api/tasks
GET    /api/tasks/:id
PATCH  /api/tasks/:id
DELETE /api/tasks/:id
```
