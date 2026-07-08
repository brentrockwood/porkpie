import { afterEach, describe, expect, it } from "vitest";
import { loadConfig } from "../src/config/env.js";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("loadConfig", () => {
  it("rejects invalid port values", () => {
    process.env.DATABASE_URL = "postgres://example";
    process.env.PORT = "not-a-number";

    expect(() => loadConfig()).toThrow("Invalid PORT value: not-a-number");
  });

  it("loads default port", () => {
    process.env.DATABASE_URL = "postgres://example";
    delete process.env.PORT;

    expect(loadConfig().port).toBe(4000);
  });

  it("loads optional Ollama classifier settings", () => {
    process.env.DATABASE_URL = "postgres://example";
    process.env.OLLAMA_BASE_URL = "http://ai1.lab:11434";
    process.env.OLLAMA_MODEL = "qwen3:8b";
    process.env.OLLAMA_TIMEOUT_MS = "2500";

    expect(loadConfig()).toMatchObject({
      ollamaBaseUrl: "http://ai1.lab:11434",
      ollamaModel: "qwen3:8b",
      ollamaTimeoutMs: 2500,
    });
  });

  it("rejects invalid Ollama timeout values", () => {
    process.env.DATABASE_URL = "postgres://example";
    process.env.OLLAMA_TIMEOUT_MS = "soon";

    expect(() => loadConfig()).toThrow("Invalid OLLAMA_TIMEOUT_MS value: soon");
  });
});
