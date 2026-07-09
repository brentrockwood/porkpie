import { summarizeTagSources, type ClassifiedTaskTag, type ClassificationInput, type ClassifierLogger, type TaskClassifier } from "./task-classifier.js";

export type OllamaTaskClassifierConfig = {
  baseUrl: string;
  model: string;
  timeoutMs?: number;
  fallback: TaskClassifier;
  logger?: ClassifierLogger;
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
      uniqueItems: true,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "confidence"],
        properties: {
          name: { type: "string", pattern: "^[a-z][a-z0-9-]{0,31}$" },
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
    let attempts = 0;

    try {
      for (attempts = 1; attempts <= 2; attempts += 1) {
        const result = await this.classifyWithOllama(input);
        if (result) {
          this.logSuccess(result, attempts);
          return result.tags;
        }
      }

      const fallbackTags = await this.config.fallback.classify(input);
      this.config.logger?.({ classifier: "ollama", outcome: "fallback", tagCount: fallbackTags.length, model: this.config.model, reason: "invalid_response", attempts: attempts - 1, tagSources: summarizeTagSources(fallbackTags, input.existingTags) });
      return fallbackTags;
    } catch (error) {
      console.warn("Ollama task classification failed; using heuristic fallback", error);
      const fallbackTags = await this.config.fallback.classify(input);
      this.config.logger?.({ classifier: "ollama", outcome: "fallback", tagCount: fallbackTags.length, model: this.config.model, reason: "error", attempts, tagSources: summarizeTagSources(fallbackTags, input.existingTags) });
      return fallbackTags;
    }
  }

  private async classifyWithOllama(input: ClassificationInput): Promise<ParseResult | null> {
    const response = await this.callOllama(input);
    return parseTags(parseJson(response), input.manualTags, input.existingTags);
  }

  private logSuccess(result: ParseResult, attempts: number): void {
    const normalized = hasNormalization(result.normalization);
    this.config.logger?.({
      classifier: "ollama",
      outcome: result.tags.length > 0 ? "success" : "empty",
      tagCount: result.tags.length,
      model: this.config.model,
      attempts,
      normalized,
      ...(normalized ? { normalization: result.normalization } : {}),
      tagSources: summarizeTagSources(result.tags, result.existingTags),
    });
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
  const existingTags = input.existingTags.length > 0 ? input.existingTags.join(", ") : "none";
  return [
    "You are tagging one todo item for a personal task app.",
    "Choose tags from this reusable taxonomy when possible: work, home, health, finance, shopping, errands, family, travel, maintenance, admin, learning.",
    "For ordinary action items, return at least one tag. Return an empty tags array only for gibberish, spam, or a task with no understandable topic.",
    "Use broad intent: groceries and purchases are shopping; appointments and chores outside the home are errands; repairs are maintenance; cleaning and household chores are home; bills, insurance, tax, and money are finance; flights, hotels, and trips are travel; reading or study is learning; relatives are family.",
    `Manual tags already on this task: ${manualTags}. Do not repeat these.`,
    `Known tags already used by this user: ${existingTags}. Prefer these when they fit.`,
    "Examples: Buy milk -> shopping; Schedule dentist appointment -> health, errands; Clean garage -> home; Pay car insurance bill -> finance; Call mom -> family; Book flight to Portland -> travel; Read TypeScript handbook -> learning; Fix leaking sink -> maintenance, home; Return Amazon package -> errands, shopping; Prepare interview presentation -> work.",
    `Title: ${input.title}`,
    `Description: ${input.description ?? "(none)"}`,
  ].join("\n");
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

type NormalizationSummary = {
  duplicateTagNames?: number;
  manualTagDuplicates?: number;
};

type ParseResult = {
  tags: ClassifiedTaskTag[];
  existingTags: string[];
  normalization: NormalizationSummary;
};

function parseTags(value: unknown, manualTags: string[], existingTags: string[]): ParseResult | null {
  if (!isRecord(value) || !Array.isArray(value.tags) || value.tags.length > MAX_TAGS) return null;

  const manualTagSet = new Set(manualTags);
  const tagsByName = new Map<string, ClassifiedTaskTag>();
  const normalization: NormalizationSummary = {};

  for (const tag of value.tags) {
    if (!isRecord(tag) || typeof tag.name !== "string" || typeof tag.confidence !== "number") return null;

    const name = tag.name.trim().toLowerCase();
    if (!isValidTagName(name) || !Number.isFinite(tag.confidence) || tag.confidence < 0 || tag.confidence > 1) return null;
    if (manualTagSet.has(name)) {
      normalization.manualTagDuplicates = (normalization.manualTagDuplicates ?? 0) + 1;
      continue;
    }

    const existing = tagsByName.get(name);
    if (existing) {
      normalization.duplicateTagNames = (normalization.duplicateTagNames ?? 0) + 1;
      if (tag.confidence > existing.confidence) {
        tagsByName.set(name, { name, confidence: tag.confidence });
      }
      continue;
    }

    tagsByName.set(name, { name, confidence: tag.confidence });
  }

  return {
    tags: [...tagsByName.values()].sort((left, right) => left.name.localeCompare(right.name)),
    existingTags,
    normalization,
  };
}

function hasNormalization(normalization: NormalizationSummary): boolean {
  return normalization.duplicateTagNames !== undefined || normalization.manualTagDuplicates !== undefined;
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
