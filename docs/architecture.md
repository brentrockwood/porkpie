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

Task classification is a replaceable service boundary, not mixed into CRUD handlers. The default implementation is deterministic and heuristic-based so tests remain stable. When `OLLAMA_BASE_URL` and `OLLAMA_MODEL` are configured, the server uses Ollama for structured JSON-schema tag suggestions and falls back to the heuristic classifier if the model call fails or returns unusable tags. Classification emits one metadata-only log event per task creation path (`classifier`, `outcome`, `tagCount`, optional `model`/`reason`) without logging task title or description content.

Current recommended local model:

```text
OLLAMA_BASE_URL=http://ai1.lab:11434
OLLAMA_MODEL=qwen3:8b
OLLAMA_TIMEOUT_MS=5000
```

Nice-to-have follow-ups:

- Retry once when the model returns invalid schema output.
- Encourage reuse of existing tags when the model wants a semantically similar new tag.
