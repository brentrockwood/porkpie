import { describe, expect, it } from "vitest";
import { sampleTasks } from "../src/db/sample-tasks.js";

describe("sample tasks", () => {
  it("contains 30 demo tasks with tags", () => {
    expect(sampleTasks).toHaveLength(30);
    expect(sampleTasks.every((task) => task.tags && task.tags.length > 0)).toBe(true);
  });
});
