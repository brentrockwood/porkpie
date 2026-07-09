# Project Porkpie Build Story

## Why this app exists

Porkpie started from a craft-interview prompt, not from a product backlog. The interview primer asked for a 60–75 minute peer code review and architecture walkthrough focused on production-grade code the candidate could directly explain: Node.js and TypeScript across frontend and backend, database communication, Python/workflow automation, senior-level system design judgment, and practical problem solving.

That framing changed the shape of the project immediately. A generic portfolio TODO app would not be enough, but a sprawling showcase would be the wrong answer too. The useful target was a small application that worked end to end and made senior engineering choices visible: clear boundaries, realistic data flow, 12-factor configuration, tests at multiple levels, API contracts, security hygiene, and explicit seams for future AI, auth, chat ingestion, and Python analysis.

The resulting project brief in `project.md` captured the central principle: **boring technology, well executed**. Porkpie would be a functional task app, but its real purpose would be to support an interview conversation about ownership: how a principal engineer takes a project from idea to working system, keeps it understandable, and leaves room for future features without overbuilding.

## Reframing the plan

The first version of the project brief described a demo TODO app with future AI and chat ideas. Early in the Pi session, we deliberately refocused it around the interview described in `Brent Rockwood Craft Interview Primer.pdf`. The app needed to demonstrate:

- React and TypeScript frontend structure.
- Node.js, Express, and TypeScript backend execution.
- REST API design and database communication.
- PostgreSQL schema choices that could support search, tags, metadata, and future retrieval.
- 12-factor style configuration: env-driven config, stateless API process, logs to stdout/stderr, Docker Compose parity.
- An auth seam that could later be replaced with OAuth/OIDC/JWT.
- AI as an enhancement behind an interface, not something tangled into CRUD handlers.
- A later Python/Jupyter path for corpus generation and classifier analysis.

We then split the work into phases. Phase 1 would be plain end-to-end CRUD. Phase 2 would add tags, search, and filtering. Later phases would layer in AI classification, Python analysis, and possible chat ingestion. This sequencing was intentional: we did not want to jump to AI before the traditional application had enough domain shape to make classification meaningful.

## Establishing the repository and baseline

The first implementation milestone was repository ownership. We initialized Git, created the GitHub repo, pushed the initial project brief, then updated `project.md` with the interview-focused phased plan. The first meaningful implementation commit was:

```text
6395218 Implement phase 1 CRUD app
```

That commit established the application skeleton:

- `client/`: React, TypeScript, Vite.
- `server/`: Express, TypeScript, REST API.
- `shared/`: shared task and request/response types.
- PostgreSQL migrations.
- Docker Compose for local development.
- README and docs for architecture, API, database, and walkthrough notes.
- A demo `AuthContext` seam with `userId` and `roles`.
- API lifecycle tests using an in-memory repository.

The early architecture was intentionally conventional:

```text
React UI -> API client -> Express routes -> TaskService -> TaskRepository -> PostgreSQL
```

Routes owned HTTP shape, services owned validation and application behavior, repositories owned persistence, and config was derived from environment variables. That gave the interview a concrete code path to trace from click to database row.

## Making verification real

Once the basic app existed, we added tests that proved more than TypeScript compilation. The user suggested using `pi-agent-browser-native` for browser-level checks and adding strong system tests for the REST API. That led to two important additions:

```text
743cf12 Add system and browser smoke tests
```

The system tests were opt-in through `SYSTEM_DATABASE_URL`, so normal unit/API tests stayed fast while interview/demo verification could exercise real PostgreSQL. The browser smoke test used `agent-browser` to create and later edit tasks through the UI.

This work immediately surfaced a real Docker issue: the server and client containers shared the same `node_modules` volume while both ran installs concurrently. The result was a corrupted install state. The fix split the volumes per service and moved container startup to deterministic `npm ci`.

That became an early example of the build process itself improving the application: the test infrastructure did not just validate code; it exposed an environment bug that would have made demos unreliable.

## Hardening the demo environment

The next concern was security posture. A scan showed fixable vulnerabilities in the original container images. Instead of ignoring them as “just a demo,” we treated them as part of the senior-engineering story:

```text
b71df10 Harden demo container images
```

We replaced the local Postgres image with Chainguard Postgres and added a small Node dev image based on a newer Node Alpine image with updated npm. We also added a repeatable scan command:

```text
npm run scan:containers
```

That was not necessary for CRUD, but it was valuable for the interview: it showed practical attention to supply-chain hygiene and gave us a concrete way to demonstrate the result.

## Improving editing and API discoverability

Small UX gaps came next. The create form should autofocus the first textbox, and edit mode needed to edit optional details, not only the title:

```text
13915ba Improve task editing UX
```

Then we made a judgment call about API documentation. For an interview where REST design and data flow would be discussed, Swagger/OpenAPI was worth adding, but only lightly. We avoided heavyweight generation and added a handwritten OpenAPI contract beside the server code:

```text
08c9b4c Add OpenAPI docs
```

This exposed:

- `GET /openapi.json`
- `GET /docs`

The decision was not “docs for docs’ sake.” It made the API contract visible during a walkthrough and set up future integrations, such as chat ingestion, to share the same backend surface.

## Turning process into project policy

After the early implementation, the user formalized the engineering workflow: determine whether tests are needed, lint, run CodeRabbit, run all tests, scan secrets with TruffleHog, and use `notify` when done or blocked. We recorded those rules in `AGENTS.md`.

At first the user asked for TSLint, but we quickly noticed TSLint was deprecated. We switched to ESLint instead. In the same pass, we made the repository public and removed committed concrete database credentials from compose files, docs, and examples. Local env files remained ignored; committed examples used placeholders.

That work produced:

```text
675bf17 Add repo checks and address review findings
7352de6 Merge pull request #2 from brentrockwood/chore/branch-pr-workflow
```

From that point on, all new work happened on branches and was proposed through pull requests. That process became part of the app’s story: each feature was small enough to review, had tests, and ended with lint/test/security checks.

## Phase 2: tags, search, and filtering

The next feature branch implemented the domain shape needed before AI classification:

```text
9eaf05f Add tags search filtering
6b64285 Merge pull request #3 from brentrockwood/feature/tags-search-filtering
```

This added normalized tables:

```text
tags
task_tags
```

The `task_tags` relationship included:

```text
source: manual | ai
confidence nullable
```

That detail mattered. Confidence belongs on the task/tag relationship, not on the tag itself. A tag like `work` can exist globally, but the confidence applies to a particular model suggestion for a particular task.

The API gained support for:

- manual tags on create/update,
- completion filtering,
- tag filtering,
- title/description search,
- returned tag metadata.

The UI gained search and filtering controls, tag display, tag editing, and cancel edit behavior. Tests covered both in-memory API behavior and real PostgreSQL behavior.

This was the point where Porkpie stopped being a generic TODO demo and became a small data-driven app with enough metadata to discuss search, classification, and future analysis.

## Demo data, pagination, and URL state

To make walkthroughs repeatable, we added seed data:

```text
21d915b Add demo seed data
```

The seed path used the service/repository behavior rather than bypassing the application. It also gained safety guards to avoid destructive seeding in production-looking environments.

Then task list pagination arrived:

```text
c258330 Add task list pagination
9d7c3f5 Filter tasks by clicking tags
```

The UI later moved away from explicit previous/next controls, but the API kept proper page metadata. Deterministic ordering used `created_at DESC, id DESC`.

Next, the large `App.tsx` was split into components and the UI state became URL-addressable:

```text
e02ad73 Refactor task app into components
6cdad77 Add edit form keyboard shortcuts
1dbbfa2 Test edit buttons and keyboard shortcuts
bbd5016 Reflect task UI state in URL
840df9f Merge pull request #4 from brentrockwood/refactor/client-components
```

That made search, filters, page, and edit state bookmarkable/back-button friendly. It also created interview talking points about browser state versus database state: the URL owns navigation state, while persisted task data remains the server/database source of truth.

## Mobile-first UI simplification

After the data features worked, we simplified the interface for actual use. The direction was Reminders-like: less chrome, hide completed by default, collapse less-used filters, prefer `Load more` over pagination controls, and make the task card itself the main edit target.

This happened in several commits on PR #5:

```text
2cd37e8 Hide completed tasks by default
30066d0 Replace pagination controls with load more
838a3b1 Collapse search and tag filters
6371c70 Add tag autocomplete source
51e288c Simplify task row interactions
def9d10 Address mobile UI review findings
```

At this stage, we realized we were hand-rolling too many UI primitives: switches, chips, autocomplete, icon buttons, focus states, responsive layouts. The user asked whether a component library would be appropriate, and we migrated to Material UI:

```text
b54737c Migrate client UI to Material UI
b83ddfe Refine Material UI task controls
0a38e8e Add removable active filter chips
8bd5f14 Merge pull request #5 from brentrockwood/feature/mobile-ui-simplification
```

Material UI was a pragmatic tradeoff. It increased bundle size, but reduced custom UI code and gave better accessibility and mobile behavior. The migration preserved the API and state logic while improving controls:

- show-completed switch,
- tag autocomplete,
- chip inputs with remove buttons,
- round checkbox icons,
- icon buttons with accessible labels,
- labeled edit fields,
- whole-card edit click target,
- removable active filter chips,
- clear-filter icon.

The smoke tests repeatedly caught subtle UI bugs during this work: stale Docker dependencies after adding MUI, tag chips not committing before save, non-idempotent filter assertions, MUI chip click behavior that differed from the DOM we expected, and keyboard propagation from nested controls. The implementation was stronger because the tests exercised the browser, not just the API.

## Adding the AI seam without adding AI yet

Once the task/tag model was in place, we added the first AI seam:

```text
89e22c9 Add deterministic task classifier seam
fe99c0c Merge pull request #6 from brentrockwood/feature/task-classifier-seam
```

This introduced:

- `TaskClassifier` interface,
- deterministic `HeuristicTaskClassifier`,
- inferred tags persisted as `source: "ai"`,
- confidence values,
- manual tags overriding duplicate AI suggestions,
- tests and docs.

The important design choice was restraint. The classifier ran on create, used deterministic rules, and had no external dependency. That kept tests stable and made the seam easy to explain: AI classification was a replaceable service boundary, not a magical side effect spread through handlers.

## Choosing and integrating a local model

After PR #6 merged, the user pointed to an Ollama instance at:

```text
http://ai1.lab:11434
```

We queried the available models and tried several candidates for structured tag classification. The practical choice was:

```text
qwen3:8b
```

It was fast enough for task creation, produced clean structured JSON in quick tests, and was much cheaper than the larger 14B/35B/70B+ options.

We also verified that Ollama accepted a JSON Schema object in its `format` field, which gave us an OpenAI-style structured-output story. That became:

```text
a977f0f Add optional Ollama task classifier
223513f Merge pull request #7 from brentrockwood/feature/ollama-task-classifier
```

The implementation added:

- optional `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, and `OLLAMA_TIMEOUT_MS`,
- async classifier interface,
- `OllamaTaskClassifier`,
- JSON Schema constrained output,
- server-side validation anyway,
- timeout/fallback behavior,
- valid `tags: []` support,
- heuristic fallback when Ollama failed or returned unusable output.

This produced a strong interview point: provider-enforced structure is useful, but it does not replace boundary validation.

## Observability before cleverness

After model integration, the next improvement was observability:

```text
e2a9375 Add task classifier observability
f6aa4eb Merge pull request #8 from brentrockwood/feature/classifier-observability
```

Classification emits metadata-only logs such as:

```json
{
  "event": "task_classification",
  "classifier": "ollama",
  "outcome": "success",
  "tagCount": 2,
  "model": "qwen3:8b"
}
```

The log intentionally avoids task titles and descriptions. It captures only operational facts: classifier path, outcome, tag count, model, fallback reason, and later attempts/normalization information.

This was a deliberate production-AI pattern. Before tuning prompts or adding features, we made the system able to tell us what path it took and how often fallback or empty classifications happened.

## Retry, schema tightening, and actionable normalization

The final AI pass in this story implemented one deferred improvement and then sharpened it through discussion:

```text
133641d Retry invalid Ollama classifier responses
3e320fb Tighten classifier schema telemetry
6cd2854 Merge pull request #9 from brentrockwood/feature/ollama-invalid-response-retry
```

First we added a single retry for invalid model output. We did **not** retry network errors or timeouts. That distinction matters: invalid content might be fixed by another generation; infrastructure errors should fail fast to deterministic fallback.

Then the user asked an important question: if JSON Schema supports regex, why not push more constraints into the schema instead of merely validating afterward? We tightened the schema with:

```text
name pattern: ^[a-z][a-z0-9-]{0,31}$
uniqueItems: true
```

Then the user pushed the observability idea further: defensive behavior is fine, but harmless model mistakes like duplicate tags can be normalized deterministically, and the observability layer should make that actionable.

The final design:

- rejects truly invalid output,
- retries once on invalid output,
- deterministically drops repeated manual tags,
- merges duplicate AI tag names by keeping the highest confidence,
- logs normalization counters:

```json
{
  "normalized": true,
  "normalization": {
    "duplicateTagNames": 1,
    "manualTagDuplicates": 1
  }
}
```

That became one of the clearest senior-engineering narratives in the project: we started with validation and fallback, added observability, then used that observability model to decide which failures should become deterministic normalization and which should remain invalid.

## How the pull-request loop shaped the app

The git history tells a story of small increments rather than one large drop:

```text
Initial project brief
Refocus plan for craft interview
Implement phase 1 CRUD app
Add system and browser smoke tests
Harden demo container images
Improve task editing UX
Add OpenAPI docs
Add repo checks and address review findings
Document branch and PR workflow
Add tags search filtering
Refactor task app into components
Reflect task UI state in URL
Migrate client UI to Material UI
Add removable active filter chips
Add deterministic task classifier seam
Add optional Ollama task classifier
Add task classifier observability
Retry invalid Ollama classifier responses
Tighten classifier schema telemetry
```

Several themes repeat across the session:

1. **Start boring, then add depth.** CRUD came before tags. Tags came before AI. Heuristic AI came before Ollama. Observability came before prompt tuning.
2. **Let tests expose reality.** Browser smoke tests found Docker install issues, stale dependencies, chip timing bugs, selector mistakes, and keyboard propagation problems.
3. **Use review as design pressure.** CodeRabbit findings led to better validation, atomic updates, safer seed behavior, stronger keyboard handling, and clearer out-of-scope decisions.
4. **Keep future seams visible.** Auth, AI, chat ingestion, search, and Python analysis all have places to plug in without rewriting core task behavior.
5. **Prefer explainable tradeoffs.** Material UI was chosen after hand-rolled controls became costly. PostgreSQL was chosen for realistic persistence and future retrieval. OpenAPI was handwritten to keep the contract close without generator complexity.

## Current state

By the end of this build sequence, Porkpie is no longer just a TODO app. It is a compact full-stack system that demonstrates:

- React/Vite/TypeScript frontend.
- Express/TypeScript REST API.
- PostgreSQL migrations and normalized tag schema.
- Docker Compose local environment.
- 12-factor configuration habits.
- OpenAPI/Swagger docs.
- API, system, and browser smoke tests.
- ESLint, CodeRabbit, TruffleHog, and container scanning in the workflow.
- Mobile-first Material UI task experience.
- URL-backed UI state.
- Manual and AI tag sources with confidence metadata.
- Optional Ollama classifier with JSON Schema output.
- Deterministic fallback and normalization.
- Metadata-only classifier observability.

Most importantly, it supports the original interview prompt. A walkthrough can begin with the UI, trace a create-task action through the client, API, service, repository, database, classifier, and logs, then branch into architecture discussions about tests, security, 12-factor config, AI boundaries, future auth, search, chat ingestion, and Python analysis.

That was the point of Porkpie: not to make TODOs novel, but to make engineering judgment visible.
