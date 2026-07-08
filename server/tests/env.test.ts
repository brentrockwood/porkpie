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
});
