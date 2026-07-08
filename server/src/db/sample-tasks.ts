import type { CreateTaskRequest } from "@porkpie/shared";

export type SampleTask = CreateTaskRequest & {
  completed?: boolean;
};

export const sampleTasks: SampleTask[] = [
  { title: "Buy oat milk", description: "Check if the store has the barista blend", tags: ["shopping", "grocery"] },
  { title: "Schedule dentist appointment", description: "Prefer a morning slot next week", tags: ["health", "calendar"] },
  { title: "Review API walkthrough notes", description: "Tighten the REST and Postgres talking points", tags: ["work", "interview"] },
  { title: "Pay utility bill", description: "Due before Friday", tags: ["finance", "home"] },
  { title: "Refill coffee beans", tags: ["shopping", "home"] },
  { title: "Draft chat integration diagram", description: "Show webhook to task service flow", tags: ["work", "architecture"] },
  { title: "Call mom", tags: ["family"], completed: true },
  { title: "Pick up dry cleaning", tags: ["errands"] },
  { title: "Update Docker notes", description: "Mention patched images and scan command", tags: ["work", "docs"] },
  { title: "Plan weekend hike", tags: ["personal", "outdoors"] },
  { title: "Order printer paper", tags: ["shopping", "office"] },
  { title: "Back up laptop", description: "Verify the external drive backup completes", tags: ["maintenance", "security"] },
  { title: "Write thank-you email", description: "Send after the interview", tags: ["interview", "email"] },
  { title: "Renew car registration", tags: ["errands", "finance"] },
  { title: "Prep sample Python notebook ideas", tags: ["python", "analysis", "interview"] },
  { title: "Clean refrigerator", tags: ["home"], completed: true },
  { title: "Compare fuzzy search options", description: "ILIKE now, trigram/full-text later", tags: ["postgres", "architecture"] },
  { title: "Buy birthday card", tags: ["shopping", "family"] },
  { title: "Read Postgres indexing notes", tags: ["learning", "postgres"] },
  { title: "Schedule oil change", tags: ["errands", "car"] },
  { title: "Create demo task corpus", description: "Use for classifier and notebook analysis", tags: ["python", "ai"] },
  { title: "Water balcony plants", tags: ["home"], completed: true },
  { title: "Review OpenAPI contract", tags: ["api", "docs"] },
  { title: "Book train tickets", tags: ["travel", "finance"] },
  { title: "Organize receipts", tags: ["finance", "home"] },
  { title: "Test malformed JSON path", tags: ["testing", "api"], completed: true },
  { title: "Outline AI classifier interface", tags: ["ai", "architecture"] },
  { title: "Buy dog food", tags: ["shopping", "pets"] },
  { title: "Prepare system design tradeoffs", tags: ["interview", "architecture"] },
  { title: "Run final demo checklist", description: "Lint, tests, system tests, e2e, secret scan", tags: ["interview", "testing"] },
];
