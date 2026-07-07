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
