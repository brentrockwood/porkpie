export type ClassificationInput = {
  title: string;
  description: string | null;
  manualTags: string[];
};

export type ClassifiedTaskTag = {
  name: string;
  confidence: number;
};

export interface TaskClassifier {
  classify(input: ClassificationInput): ClassifiedTaskTag[];
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
  classify(input: ClassificationInput): ClassifiedTaskTag[] {
    const text = `${input.title} ${input.description ?? ""}`.toLowerCase();
    const manualTags = new Set(input.manualTags);

    return RULES.filter((rule) => !manualTags.has(rule.tag) && rule.keywords.some((keyword) => hasWord(text, keyword)))
      .map((rule) => ({ name: rule.tag, confidence: rule.confidence }))
      .sort((left, right) => left.name.localeCompare(right.name));
  }
}

function hasWord(text: string, word: string): boolean {
  return new RegExp(`\\b${escapeRegExp(word)}\\b`, "i").test(text);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
