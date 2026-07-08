import { afterEach, describe, expect, it } from "vitest";
import { seedDemoData } from "../src/db/seed.js";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("seedDemoData", () => {
  it("refuses to run in production", async () => {
    process.env.NODE_ENV = "production";

    await expect(seedDemoData("postgres://example")).rejects.toThrow(
      "Refusing to run demo seed against a production environment",
    );
  });
});
