import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { PoolClient } from "pg";
import { createPool } from "./pool.js";
import { loadConfig } from "../config/env.js";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(dirname, "../../migrations");

export async function runMigrations(databaseUrl: string): Promise<void> {
  const pool = createPool(databaseUrl);

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const files = (await readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();

    for (const file of files) {
      const client = await pool.connect();
      try {
        await applyMigration(client, file);
      } finally {
        client.release();
      }
    }
  } finally {
    await pool.end();
  }
}

async function applyMigration(client: PoolClient, file: string): Promise<void> {
  const existing = await client.query("SELECT 1 FROM schema_migrations WHERE name = $1", [file]);
  if (existing.rowCount) return;

  const sql = await readFile(path.join(migrationsDir, file), "utf8");
  await client.query("BEGIN");
  try {
    await client.query(sql);
    await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
    await client.query("COMMIT");
    console.log(`applied migration ${file}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const config = loadConfig();
  runMigrations(config.databaseUrl).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
