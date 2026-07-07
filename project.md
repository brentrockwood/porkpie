# Project Porkpie

Porkpie is an interview-support demo application: a functional TODO/task app used to walk through senior-level engineering choices in a live technical craft interview.

The goal is not portfolio polish for its own sake. The goal is to demonstrate clear ownership of a modern TypeScript application: practical architecture, end-to-end data flow, 12-factor discipline, testability, and thoughtful seams for future AI, auth, chat, and Python-based analysis.

## Interview Context

The application should support a 60–75 minute code and architecture walkthrough covering:

- Node.js, TypeScript, frontend, and backend execution
- React application structure
- REST API and database communication
- Senior-level architectural tradeoffs
- Python engineering / workflow automation
- AI-assisted task classification
- Data-driven application design

## Guiding Principles

- Functional first: the app must work end to end.
- Boring technology, well executed.
- Small, composable modules.
- Clear separation of concerns.
- 12-factor-aware configuration and deployment shape.
- AI enhances traditional software; it does not replace core app behavior.
- Prefer visible architectural seams over speculative complexity.
- Readability over cleverness.

## Technical Stack

### Frontend

- React
- TypeScript
- Vite

### Backend

- Node.js
- Express
- TypeScript
- REST API

### Data

- PostgreSQL
- SQL migrations

PostgreSQL is preferred because it is production-like and leaves room for future full-text search, trigram/fuzzy retrieval, JSON metadata, indexing strategies, and analytical queries.

### Infrastructure

- Docker Compose for local development parity
- Environment-variable configuration
- Logs to stdout/stderr
- Stateless API process

### Testing

- Backend API tests for task lifecycle behavior
- Unit tests where they clarify meaningful business logic
- Frontend tests for primary CRUD flows once the UI exists
- Fake/deterministic implementations for AI and external integrations in tests

## Phase 1: Basic App Structure and CRUD

Goal: create a functional full-stack task application with clean structure and end-to-end CRUD.

### Deliverables

- `client/` React + TypeScript + Vite app
- `server/` Express + TypeScript API
- `shared/` shared request/response/domain types where useful
- `docker/` or root Docker Compose configuration
- PostgreSQL database
- SQL migrations
- README with local development instructions
- Basic architecture notes

### Backend API

Initial endpoints:

```text
GET    /health
GET    /api/tasks
POST   /api/tasks
GET    /api/tasks/:id
PATCH  /api/tasks/:id
DELETE /api/tasks/:id
```

Initial task model:

```ts
type Task = {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};
```

### Backend Architecture

Use a simple layered structure:

- routes/controllers: HTTP request/response concerns
- services: application behavior and business rules
- repositories: database access
- config: environment-derived settings
- db: connection and migration support

### Frontend Architecture

- React components for task list, form, and item actions
- API client module separate from UI components
- Local UI state sufficient for Phase 1
- No global state library unless needed later

### 12-Factor Talking Points

Phase 1 should make these choices visible:

- Config from environment variables
- Postgres attached via `DATABASE_URL`
- Logs emitted to stdout/stderr
- Stateless API process
- Docker Compose for dev/prod parity
- Dependency manifests and lockfiles committed
- Build/run separation where practical

### Auth Seam

Do not implement full auth in Phase 1. Add an explicit seam that can be discussed later:

```ts
type AuthContext = {
  userId: string;
  roles: string[];
};
```

For now, middleware may attach a demo user. Future OAuth/OIDC/JWT validation should be replaceable without rewriting task services.

## Phase 2: Tags, Search, and Filtering

Goal: make the app feel more realistic and prepare for AI classification.

Features:

- Tags
- Filter by completion status
- Filter by tag
- Search task title/description

Preferred schema direction:

```text
tasks
- id
- title
- description
- completed
- created_at
- updated_at

tags
- id
- name

task_tags
- task_id
- tag_id
- source: manual | ai
- confidence nullable
```

Talking points:

- Confidence belongs on the task/tag relationship, not the tag itself.
- Manual and AI-generated tags can coexist.
- Search can begin with simple SQL and later move to Postgres full-text or trigram fuzzy search.

## Phase 3: AI Classification

Goal: show AI as a replaceable enhancement behind a clear interface.

Classifier interface shape:

```ts
interface TaskClassifier {
  classify(input: {
    title: string;
    description?: string;
  }): Promise<Array<{
    tag: string;
    confidence: number;
  }>>;
}
```

Implementations may include:

- `FakeClassifier` for deterministic tests and demos
- `HeuristicClassifier` for local rule-based behavior
- `LLMClassifier` for a real model provider later

On task creation:

1. API receives task input.
2. Task is created.
3. Classifier suggests tags.
4. Tags and confidence metadata are persisted.
5. Response includes task and classification metadata.
6. User can manually override tags.

Talking points:

- AI is isolated behind a port/interface.
- Tests do not depend on model or network behavior.
- Manual override keeps users in control.
- Classification could move async via a queue if latency/cost becomes a concern.

## Phase 4: Python and Jupyter Analysis

Goal: support the Python portion of the interview with a realistic data workflow tied to the app.

Possible deliverables:

```text
notebooks/task_corpus_analysis.ipynb
tools/generate_task_corpus.py
tools/classify_corpus.py
```

Ideas:

- Generate a synthetic task corpus.
- Analyze tag distribution and ambiguity in a Jupyter notebook.
- Use the corpus for classifier iteration, seed data, and demos.
- Show confidence distributions and examples of classification mistakes.

This demonstrates Python workflow automation and exploratory analysis without bolting unrelated Python onto the app.

## Phase 5: Chat Integration

Goal: show external ingestion through the same backend API/service path as the web UI.

Options:

- Telegram bot integration
- Slack app/webhook integration

Desired flow:

```text
Chat message
  -> webhook handler
  -> normalize into CreateTaskRequest
  -> task service
  -> classifier
  -> database
  -> confirmation response
```

Key principle: chat-created tasks should not use a separate business logic path.

## Documentation

Keep documentation focused on the live interview walkthrough:

- `README.md`: setup, run, test
- `docs/architecture.md`: system shape and tradeoffs
- `docs/api.md`: endpoint overview
- `docs/database.md`: schema and migration notes
- `docs/walkthrough.md`: interview walkthrough script / talking points

## Out of Scope For Now

- Teams
- Advanced auth implementation
- Realtime collaboration
- Mobile
- Electron
- Calendar sync
- Complex permissions
- Production deployment automation beyond local Docker Compose

## Phase 1 Definition of Done

- Docker Compose starts Postgres, server, and client or provides clear local commands.
- Backend CRUD works end to end against Postgres.
- Frontend can create, view, edit, complete, and delete tasks.
- Migrations create the required schema.
- Config is environment-driven.
- API tests cover the task lifecycle.
- README explains how to run and test the app.
- Architecture notes explain Postgres, REST, 12-factor choices, auth seam, and future AI seam.
