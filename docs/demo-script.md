# Porkpie Demo Script

## Setup checks

1. Start the stack:
   ```sh
   docker compose up -d --build
   ```
2. Confirm the app loads on desktop: <http://localhost:5173>.
3. For mobile or named-host demos, open one of:
   - `http://<computer-lan-ip>:5173`
   - `http://tasks.brentrockwood.net:5173`
   - `http://dh1.lab:5173`
   - `http://ws5.lab:5173`
4. Confirm Ollama is configured in the server container:
   ```sh
   docker compose exec server env | grep OLLAMA
   ```

## Five-minute walkthrough

1. **Create with AI tags**
   - Create `Buy milk` with no manual tags.
   - Point out the AI-suggested `shopping` chip and confidence tooltip.
   - Create `Clean garage` or `Pay car insurance bill` to show broad reusable tags.

2. **Filter by tag**
   - Tap/click an AI tag chip.
   - Show the filtered list and URL-backed filter state.

3. **Manual intent wins**
   - Edit a task and replace its tags with a manual tag.
   - Explain that AI tags are generated on create only; explicit edits replace them.

4. **Mobile-first list behavior**
   - Show hidden completed tasks by default.
   - Toggle completed visibility.
   - Use `Load more` at the bottom of the list.

5. **Architecture trace**
   - Follow a create action through:
     ```text
     React form -> API client -> Express route -> TaskService -> TaskRepository -> PostgreSQL
                                  ↳ TaskClassifier -> Ollama or heuristic fallback
     ```
   - Open `/docs` or `/openapi.json` to show the API contract.

## Seams to highlight

- `TaskService` owns validation and orchestration.
- `TaskRepository` hides persistence and can be swapped in tests.
- `TaskClassifier` is an interface with heuristic and Ollama implementations.
- `AuthContext` is a placeholder seam for future OAuth/OIDC/JWT middleware.
- Vite proxies `/api` in dev so mobile browsers call the same origin instead of their own `localhost`.
- Env vars control deployment concerns: database URL, client origin, Ollama endpoint/model/timeout.

## Troubleshooting

- If mobile can load the page but API calls fail, confirm the browser is using the Vite origin and `/api` proxy.
- If title-only tasks do not get AI tags, recreate the server after env changes:
  ```sh
  docker compose up -d --force-recreate server client
  ```
- If Ollama returns empty tags for ordinary tasks, test the prompt directly against `/api/generate` before changing app code.
