import { createApp } from "./app.js";
import { loadConfig } from "./config/env.js";
import { createPool } from "./db/pool.js";
import { OllamaTaskClassifier } from "./tasks/ollama-task-classifier.js";
import { HeuristicTaskClassifier, type TaskClassifier } from "./tasks/task-classifier.js";
import { PostgresTaskRepository } from "./tasks/task-repository.js";
import { TaskService } from "./tasks/task-service.js";

const config = loadConfig();
const pool = createPool(config.databaseUrl);
const repository = new PostgresTaskRepository(pool);
const fallbackClassifier = new HeuristicTaskClassifier();
const classifier: TaskClassifier = config.ollamaBaseUrl && config.ollamaModel
  ? new OllamaTaskClassifier({
      baseUrl: config.ollamaBaseUrl,
      model: config.ollamaModel,
      timeoutMs: config.ollamaTimeoutMs,
      fallback: fallbackClassifier,
    })
  : fallbackClassifier;
const taskService = new TaskService(repository, classifier);
const app = createApp(taskService, config.clientOrigin);

app.listen(config.port, () => {
  console.log(`server listening on port ${config.port}`);
});
