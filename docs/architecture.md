# Architecture

Porkpie is intentionally small: React client, Express API, and PostgreSQL database.

```text
React UI -> API client -> Express routes -> TaskService -> TaskRepository -> PostgreSQL
```

## Phase 1 boundaries

- **Routes/controllers** handle HTTP shape, status codes, and JSON responses.
- **Services** own application behavior and validation.
- **Repositories** own persistence details.
- **Shared types** keep API payloads visible to both client and server.

## 12-factor notes

- Configuration is supplied through environment variables.
- The database is attached through `DATABASE_URL`.
- The API process is stateless.
- Logs are written to stdout/stderr.
- Docker Compose provides local backing services and dev/prod parity.
- Dependencies are declared in package manifests and locked by npm.

## Postgres choice

PostgreSQL is production-like while still easy to run locally. It also leaves room for later full-text search, trigram/fuzzy retrieval, JSON metadata, indexes, and analytical queries over task/classification data.

## Auth seam

Phase 1 uses a demo `AuthContext`:

```ts
type AuthContext = {
  userId: string;
  roles: string[];
};
```

The task service depends on that context, not on a concrete OAuth/JWT/session provider. A later OAuth/OIDC middleware can populate the same context without rewriting task behavior.

## AI seam

AI classification is planned as a later service boundary, not mixed into CRUD handlers. The intended shape is a replaceable classifier interface with deterministic test implementations and optional real model-backed implementations.
