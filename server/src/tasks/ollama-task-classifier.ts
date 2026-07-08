import type { ClassifiedTaskTag, ClassificationInput, TaskClassifier } from "./task-classifier.js";

export type OllamaTaskClassifierConfig = {
  baseUrl: string;
  model: string;
  timeoutMs?: number;
  fallback: TaskClassifier;
};

const DEFAULT_TIMEOUT_MS = 5_000;
const MAX_TAGS = 3;

const responseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["tags"],
  properties: {
    tags: {
      type: "array",
      minItems: 0,
      maxItems: MAX_TAGS,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "confidence"],
        properties: {
          name: { type: "string" },
          confidence: { type: "number", minimum: 0, maximum: 1 },
        },
      },
    },
  },
} as const;

export class OllamaTaskClassifier implements TaskClassifier {
  private readonly timeoutMs: number;

  constructor(private readonly config: OllamaTaskClassifierConfig) {
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async classify(input: ClassificationInput): Promise<ClassifiedTaskTag[]> {
    try {
      const response = await this.callOllama(input);
      const parsed = JSON.parse(response) as unknown;
      const tags = parseTags(parsed, input.manualTags);
      return tags ?? this.config.fallback.classify(input);
    } catch (error) {
      console.warn("Ollama task classification failed; using heuristic fallback", error);
      return this.config.fallback.classify(input);
    }
  }

  private async callOllama(input: ClassificationInput): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(new URL("/api/generate", normalizeBaseUrl(this.config.baseUrl)), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.config.model,
          stream: false,
          format: responseSchema,
          options: { temperature: 0, num_predict: 120 },
          prompt: buildPrompt(input),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Ollama returned ${response.status}`);
      }

      const body = (await response.json()) as { response?: unknown };
      if (typeof body.response !== "string") {
        throw new Error("Ollama response did not contain a string response field");
      }

      return body.response;
    } finally {
      clearTimeout(timeout);
    }
  }
}

function buildPrompt(input: ClassificationInput): string {
  const manualTags = input.manualTags.length > 0 ? input.manualTags.join(", ") : "none";
  return [
    "Classify this todo task for a personal task app.",
    `Existing manual tags: ${manualTags}. Do not repeat an existing manual tag.`,
    "Return 0 to 3 useful lowercase single-word tags.",
    "Prefer broad reusable tags over one-off words.",
    `Title: ${input.title}`,
    `Description: ${input.description ?? ""}`,
  ].join("\n");
}

function parseTags(value: unknown, manualTags: string[]): ClassifiedTaskTag[] | null {
  if (!isRecord(value) || !Array.isArray(value.tags) || value.tags.length > MAX_TAGS) return null;

  const manualTagSet = new Set(manualTags);
  const seen = new Set<string>();
  const tags: ClassifiedTaskTag[] = [];

  for (const tag of value.tags) {
    if (!isRecord(tag) || typeof tag.name !== "string" || typeof tag.confidence !== "number") return null;

    const name = tag.name.trim().toLowerCase();
    if (!isValidTagName(name) || !Number.isFinite(tag.confidence) || tag.confidence < 0 || tag.confidence > 1) return null;
    if (manualTagSet.has(name) || seen.has(name)) continue;

    seen.add(name);
    tags.push({ name, confidence: tag.confidence });
  }

  return tags.sort((left, right) => left.name.localeCompare(right.name));
}

function isValidTagName(value: string): boolean {
  return /^[a-z][a-z0-9-]{0,31}$/.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeBaseUrl(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}
