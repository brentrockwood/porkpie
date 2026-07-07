import { createApp } from "./app.js";
import { loadConfig } from "./config/env.js";
import { createPool } from "./db/pool.js";
import { PostgresTaskRepository } from "./tasks/task-repository.js";
import { TaskService } from "./tasks/task-service.js";

const config = loadConfig();
const pool = createPool(config.databaseUrl);
const repository = new PostgresTaskRepository(pool);
const taskService = new TaskService(repository);
const app = createApp(taskService, config.clientOrigin);

app.listen(config.port, () => {
  console.log(`server listening on port ${config.port}`);
});
