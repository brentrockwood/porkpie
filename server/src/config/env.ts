import "dotenv/config";

export type AppConfig = {
  port: number;
  databaseUrl: string;
  clientOrigin: string;
  ollamaBaseUrl: string | null;
  ollamaModel: string | null;
  ollamaTimeoutMs: number;
};

export function loadConfig(): AppConfig {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const rawPort = process.env.PORT ?? "4000";
  const port = Number(rawPort);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid PORT value: ${rawPort}`);
  }

  return {
    port,
    databaseUrl,
    clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL?.trim() || null,
    ollamaModel: process.env.OLLAMA_MODEL?.trim() || null,
    ollamaTimeoutMs: parseOptionalPositiveInteger(process.env.OLLAMA_TIMEOUT_MS, "OLLAMA_TIMEOUT_MS") ?? 5_000,
  };
}

function parseOptionalPositiveInteger(value: string | undefined, name: string): number | null {
  if (value === undefined || value.trim() === "") return null;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${name} value: ${value}`);
  }

  return parsed;
}
