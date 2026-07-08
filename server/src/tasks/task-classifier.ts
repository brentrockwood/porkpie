export type ClassificationInput = {
  title: string;
  description: string | null;
  manualTags: string[];
};

export type ClassifiedTaskTag = {
  name: string;
  confidence: number;
};

export type ClassifierLogEvent = {
  classifier: "heuristic" | "ollama";
  outcome: "success" | "empty" | "fallback";
  tagCount: number;
  model?: string;
  reason?: "error" | "invalid_response";
  attempts?: number;
};

export type ClassifierLogger = (event: ClassifierLogEvent) => void;

export interface TaskClassifier {
  classify(input: ClassificationInput): Promise<ClassifiedTaskTag[]>;
}

type Rule = {
  tag: string;
  confidence: number;
  keywords: string[];
};

const RULES: Rule[] = [
  { tag: "work", confidence: 0.85, keywords: ["architecture", "client", "deadline", "interview", "meeting", "presentation", "proposal", "review"] },
  { tag: "home", confidence: 0.8, keywords: ["clean", "garage", "laundry", "organize", "repair"] },
  { tag: "health", confidence: 0.8, keywords: ["doctor", "exercise", "medication", "therapy", "workout"] },
  { tag: "finance", confidence: 0.78, keywords: ["budget", "invoice", "tax", "taxes", "receipt"] },
];

export class HeuristicTaskClassifier implements TaskClassifier {
  constructor(private readonly logger?: ClassifierLogger) {}

  async classify(input: ClassificationInput): Promise<ClassifiedTaskTag[]> {
    const text = `${input.title} ${input.description ?? ""}`.toLowerCase();
    const manualTags = new Set(input.manualTags);

    const tags = RULES.filter((rule) => !manualTags.has(rule.tag) && rule.keywords.some((keyword) => hasWord(text, keyword)))
      .map((rule) => ({ name: rule.tag, confidence: rule.confidence }))
      .sort((left, right) => left.name.localeCompare(right.name));

    this.logger?.({ classifier: "heuristic", outcome: tags.length > 0 ? "success" : "empty", tagCount: tags.length });
    return tags;
  }
}

function hasWord(text: string, word: string): boolean {
  return new RegExp(`\\b${escapeRegExp(word)}\\b`, "i").test(text);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
