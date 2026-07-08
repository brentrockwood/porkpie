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

    await expect(classifier.classify({ title: "Prepare interview notes", description: null, manualTags: [] })).resolves.toEqual([
      { name: "work", confidence: 0.9 },
    ]);

    expect(fetchMock).toHaveBeenCalledWith(
      new URL("http://ollama.example:11434/api/generate"),
      expect.objectContaining({
        method: "POST",
        body: expect.any(String),
      }),
    );
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)) as { format?: unknown; model?: unknown };
    expect(body.model).toBe("qwen3:8b");
    expect(body.format).toMatchObject({ required: ["tags"] });
    expect(logger).toHaveBeenCalledWith({ classifier: "ollama", outcome: "success", tagCount: 1, model: "qwen3:8b" });
  });

  it("filters manual duplicates from valid model tags", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          response: JSON.stringify({
            tags: [
              { name: "work", confidence: 0.9 },
              { name: "health", confidence: 0.7 },
            ],
          }),
        }),
        { status: 200 },
      ),
    );

    const classifier = new OllamaTaskClassifier({ baseUrl: "http://ollama.example:11434", model: "qwen3:8b", fallback: fallback([]) });

    await expect(classifier.classify({ title: "Task", description: null, manualTags: ["work"] })).resolves.toEqual([
      { name: "health", confidence: 0.7 },
    ]);
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

    await expect(classifier.classify({ title: "Task", description: null, manualTags: [] })).resolves.toEqual([]);
    expect(logger).toHaveBeenCalledWith({ classifier: "ollama", outcome: "empty", tagCount: 0, model: "qwen3:8b" });
  });

  it("uses fallback tags when Ollama is unavailable or invalid", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ response: JSON.stringify({ tags: [{ name: "two words", confidence: 0.8 }] }) }), { status: 200 }));

    const logger = vi.fn();
    const classifier = new OllamaTaskClassifier({
      baseUrl: "http://ollama.example:11434",
      model: "qwen3:8b",
      fallback: fallback([{ name: "work", confidence: 0.85 }]),
      logger,
    });

    await expect(classifier.classify({ title: "Review architecture", description: null, manualTags: [] })).resolves.toEqual([
      { name: "work", confidence: 0.85 },
    ]);
    expect(logger).toHaveBeenCalledWith({ classifier: "ollama", outcome: "fallback", tagCount: 1, model: "qwen3:8b", reason: "invalid_response" });
  });
});

function fallback(tags: { name: string; confidence: number }[]): TaskClassifier {
  return {
    async classify() {
      return tags;
    },
  };
}
