import path from "node:path";
import { fileURLToPath } from "node:url";
import { demoAuthContext } from "../auth/auth-context.js";
import { loadConfig } from "../config/env.js";
import { createPool } from "./pool.js";
import { runMigrations } from "./migrate.js";
import { sampleTasks } from "./sample-tasks.js";
import { PostgresTaskRepository } from "../tasks/task-repository.js";
import { TaskService } from "../tasks/task-service.js";

export async function seedDemoData(databaseUrl: string): Promise<void> {
  assertSeedAllowed(databaseUrl);
  await runMigrations(databaseUrl);

  const pool = createPool(databaseUrl);
  try {
    await pool.query("TRUNCATE tasks CASCADE");

    const taskService = new TaskService(new PostgresTaskRepository(pool));

    for (const sample of sampleTasks) {
      const task = await taskService.createTask(demoAuthContext, sample);
      if (sample.completed) {
        await taskService.updateTask(demoAuthContext, task.id, { completed: true });
      }
    }

    console.log(`seeded ${sampleTasks.length} sample tasks`);
  } finally {
    await pool.end();
  }
}

function assertSeedAllowed(databaseUrl: string): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run demo seed against a production environment");
  }

  if (/\b(prod|production)\b/i.test(databaseUrl)) {
    throw new Error("Refusing to run demo seed: databaseUrl looks like a production connection string");
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const config = loadConfig();
  seedDemoData(config.databaseUrl).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
