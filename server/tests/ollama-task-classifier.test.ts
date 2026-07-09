import { afterEach, describe, expect, it, vi } from "vitest";
import type { TaskClassifier } from "../src/tasks/task-classifier.js";
import { OllamaTaskClassifier } from "../src/tasks/ollama-task-classifier.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("OllamaTaskClassifier", () => {
  it("requests JSON schema output and returns validated tags", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ response: JSON.stringify({ tags: [{ name: "Work", confidence: 0.9 }] }) }), { status: 200 }),
    );
    globalThis.fetch = fetchMock;

    const logger = vi.fn();
    const classifier = new OllamaTaskClassifier({
      baseUrl: "http://ollama.example:11434",
      model: "qwen3:8b",
      fallback: fallback([]),
      logger,
    });

    await expect(classifier.classify({ title: "Prepare interview notes", description: null, manualTags: [], existingTags: ["health", "work"] })).resolves.toEqual([
      { name: "work", confidence: 0.9 },
    ]);

    expect(fetchMock).toHaveBeenCalledWith(
      new URL("http://ollama.example:11434/api/generate"),
      expect.objectContaining({
        method: "POST",
        body: expect.any(String),
      }),
    );
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)) as { format?: unknown; model?: unknown; prompt?: string };
    expect(body.model).toBe("qwen3:8b");
    expect(body.format).toMatchObject({
      required: ["tags"],
      properties: { tags: { uniqueItems: true, items: { properties: { name: { pattern: "^[a-z][a-z0-9-]{0,31}$" } } } } },
    });
    expect(body.prompt).toContain("Known tags already used by this user: health, work");
    expect(body.prompt).toContain("For ordinary action items, return at least one tag");
    expect(body.prompt).toContain("groceries and purchases are shopping");
    expect(body.prompt).toContain("Buy milk -> shopping");
    expect(logger).toHaveBeenCalledWith({ classifier: "ollama", outcome: "success", tagCount: 1, model: "qwen3:8b", attempts: 1, normalized: false, tagSources: { existing: 1, new: 0 } });
  });

  it("normalizes manual duplicates and duplicate model tag names with actionable telemetry", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          response: JSON.stringify({
            tags: [
              { name: "work", confidence: 0.9 },
              { name: "health", confidence: 0.7 },
              { name: "health", confidence: 0.8 },
            ],
          }),
        }),
        { status: 200 },
      ),
    );

    const logger = vi.fn();
    const classifier = new OllamaTaskClassifier({ baseUrl: "http://ollama.example:11434", model: "qwen3:8b", fallback: fallback([]), logger });

    await expect(classifier.classify({ title: "Task", description: null, manualTags: ["work"], existingTags: ["health", "work"] })).resolves.toEqual([
      { name: "health", confidence: 0.8 },
    ]);
    expect(logger).toHaveBeenCalledWith({
      classifier: "ollama",
      outcome: "success",
      tagCount: 1,
      model: "qwen3:8b",
      attempts: 1,
      normalized: true,
      normalization: { duplicateTagNames: 1, manualTagDuplicates: 1 },
      tagSources: { existing: 1, new: 0 },
    });
  });

  it("accepts an empty tag list as a valid model answer", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ response: JSON.stringify({ tags: [] }) }), { status: 200 }));

    const logger = vi.fn();
    const classifier = new OllamaTaskClassifier({
      baseUrl: "http://ollama.example:11434",
      model: "qwen3:8b",
      fallback: fallback([{ name: "work", confidence: 0.85 }]),
      logger,
    });

    await expect(classifier.classify({ title: "Task", description: null, manualTags: [], existingTags: [] })).resolves.toEqual([]);
    expect(logger).toHaveBeenCalledWith({ classifier: "ollama", outcome: "empty", tagCount: 0, model: "qwen3:8b", attempts: 1, normalized: false, tagSources: { existing: 0, new: 0 } });
  });

  it("retries once when Ollama returns invalid tags", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ response: JSON.stringify({ tags: [{ name: "two words", confidence: 0.8 }] }) }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ response: JSON.stringify({ tags: [{ name: "work", confidence: 0.85 }] }) }), { status: 200 }));
    globalThis.fetch = fetchMock;

    const logger = vi.fn();
    const classifier = new OllamaTaskClassifier({
      baseUrl: "http://ollama.example:11434",
      model: "qwen3:8b",
      fallback: fallback([]),
      logger,
    });

    await expect(classifier.classify({ title: "Review architecture", description: null, manualTags: [], existingTags: [] })).resolves.toEqual([
      { name: "work", confidence: 0.85 },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(logger).toHaveBeenCalledWith({ classifier: "ollama", outcome: "success", tagCount: 1, model: "qwen3:8b", attempts: 2, normalized: false, tagSources: { existing: 0, new: 1 } });
  });

  it("uses fallback tags after two invalid Ollama responses", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ response: JSON.stringify({ tags: [{ name: "two words", confidence: 0.8 }] }) }), { status: 200 })));
    globalThis.fetch = fetchMock;

    const logger = vi.fn();
    const classifier = new OllamaTaskClassifier({
      baseUrl: "http://ollama.example:11434",
      model: "qwen3:8b",
      fallback: fallback([{ name: "work", confidence: 0.85 }]),
      logger,
    });

    await expect(classifier.classify({ title: "Review architecture", description: null, manualTags: [], existingTags: [] })).resolves.toEqual([
      { name: "work", confidence: 0.85 },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(logger).toHaveBeenCalledWith({ classifier: "ollama", outcome: "fallback", tagCount: 1, model: "qwen3:8b", reason: "invalid_response", attempts: 2, tagSources: { existing: 0, new: 1 } });
  });

  it("logs two attempts when an invalid response retry throws", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ response: JSON.stringify({ tags: [{ name: "two words", confidence: 0.8 }] }) }), { status: 200 }))
      .mockRejectedValueOnce(new Error("offline"));
    globalThis.fetch = fetchMock;

    const logger = vi.fn();
    const classifier = new OllamaTaskClassifier({
      baseUrl: "http://ollama.example:11434",
      model: "qwen3:8b",
      fallback: fallback([{ name: "work", confidence: 0.85 }]),
      logger,
    });

    await expect(classifier.classify({ title: "Review architecture", description: null, manualTags: [], existingTags: [] })).resolves.toEqual([
      { name: "work", confidence: 0.85 },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(logger).toHaveBeenCalledWith({ classifier: "ollama", outcome: "fallback", tagCount: 1, model: "qwen3:8b", reason: "error", attempts: 2, tagSources: { existing: 0, new: 1 } });
  });

  it("does not retry Ollama call errors", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const fetchMock = vi.fn().mockRejectedValue(new Error("offline"));
    globalThis.fetch = fetchMock;

    const logger = vi.fn();
    const classifier = new OllamaTaskClassifier({
      baseUrl: "http://ollama.example:11434",
      model: "qwen3:8b",
      fallback: fallback([{ name: "work", confidence: 0.85 }]),
      logger,
    });

    await expect(classifier.classify({ title: "Review architecture", description: null, manualTags: [], existingTags: [] })).resolves.toEqual([
      { name: "work", confidence: 0.85 },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(logger).toHaveBeenCalledWith({ classifier: "ollama", outcome: "fallback", tagCount: 1, model: "qwen3:8b", reason: "error", attempts: 1, tagSources: { existing: 0, new: 1 } });
  });
});

function fallback(tags: { name: string; confidence: number }[]): TaskClassifier {
  return {
    async classify() {
      return tags;
    },
  };
}
