# Interview Walkthrough Notes

1. Start with the product boundary: small task app, built to expose architectural decisions.
2. Show the request lifecycle: React component -> API client -> Express route -> service -> repository -> Postgres.
3. Explain 12-factor choices: env config, stateless API, logs, Docker Compose, backing services.
4. Discuss PostgreSQL: production-like today, full-text/fuzzy search and analytics later.
5. Show the auth seam: `AuthContext` currently demo-backed, replaceable with OAuth/OIDC/JWT middleware.
6. Show tests: API lifecycle covered with an in-memory repository to keep tests deterministic.
7. Discuss next phases: tags/search, AI classifier interface, Python/Jupyter corpus analysis, chat ingestion.

## Tradeoffs to call out

- REST is sufficient for this domain and easy for both web UI and chat integrations.
- The service/repository split is small but useful: it keeps HTTP and SQL concerns out of business behavior.
- The test repository avoids requiring Docker for fast API tests, while production still uses Postgres.
- AI is intentionally not in Phase 1; the seam matters more than prematurely calling a model.

## Config/seams

 - Mobile/named-host dev access
     - client/vite.config.ts
     - host: "0.0.0.0" exposes Vite on LAN.
     - allowedHosts permits your demo hostnames.
     - Vite proxies /api to the server, so phones don’t call their own localhost.

 - Ollama classifier config
     - .env / .env.example
     - OLLAMA_BASE_URL, OLLAMA_MODEL, OLLAMA_TIMEOUT_MS
     - Show how changing env swaps model-backed classification on/off without code changes.

 - AI seam
     - server/src/tasks/task-classifier.ts
     - server/src/tasks/ollama-task-classifier.ts
     - TaskClassifier lets you swap heuristic vs Ollama.
     - Manual tags override/replace AI suggestions.

 - Business logic seam
     - server/src/tasks/task-service.ts
     - Validation/orchestration lives here, not in routes or DB code.

 - Persistence seam
     - server/src/tasks/task-repository.ts
     - Postgres implementation is behind repository interface; tests use in-memory repo.

 - Auth seam
     - server/src/auth/auth-context.ts
     - Demo auth context today; future OAuth/OIDC/JWT can populate the same shape.

 - API contract
     - server/src/openapi.ts
     - /docs and /openapi.json make the REST surface reviewable.

