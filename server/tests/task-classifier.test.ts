import { describe, expect, it, vi } from "vitest";
import { HeuristicTaskClassifier } from "../src/tasks/task-classifier.js";

describe("HeuristicTaskClassifier", () => {
  it("logs classification metadata without task content", async () => {
    const logger = vi.fn();
    const classifier = new HeuristicTaskClassifier(logger);

    await expect(classifier.classify({ title: "Review architecture", description: "Client notes", manualTags: [], existingTags: ["work"] })).resolves.toEqual([
      { name: "work", confidence: 0.85 },
    ]);

    expect(logger).toHaveBeenCalledWith({ classifier: "heuristic", outcome: "success", tagCount: 1, tagSources: { existing: 1, new: 0 } });
    expect(JSON.stringify(logger.mock.calls)).not.toContain("Review architecture");
    expect(JSON.stringify(logger.mock.calls)).not.toContain("Client notes");
  });
});
