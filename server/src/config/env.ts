import "dotenv/config";

export type AppConfig = {
  port: number;
  databaseUrl: string;
  clientOrigin: string;
};

export function loadConfig(): AppConfig {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  return {
    port: Number(process.env.PORT ?? 4000),
    databaseUrl,
    clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  };
}
