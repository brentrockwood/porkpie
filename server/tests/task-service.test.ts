import { describe, expect, it } from "vitest";
import type { ClassificationInput, ClassifiedTaskTag, TaskClassifier } from "../src/tasks/task-classifier.js";
import { TaskService } from "../src/tasks/task-service.js";
import { InMemoryTaskRepository } from "./in-memory-task-repository.js";

const auth = { userId: "test-user", roles: ["user"] };

describe("TaskService", () => {
  it("passes existing user tags to the classifier when creating a task", async () => {
    const repository = new InMemoryTaskRepository();
    const classifier = new RecordingClassifier();
    const service = new TaskService(repository, classifier);

    await service.createTask(auth, { title: "Existing tagged task", tags: ["Work"] });
    await service.createTask(auth, { title: "Classify next task" });

    expect(classifier.inputs[1]).toMatchObject({
      title: "Classify next task",
      manualTags: [],
      existingTags: ["work"],
    });
  });
});

class RecordingClassifier implements TaskClassifier {
  readonly inputs: ClassificationInput[] = [];

  async classify(input: ClassificationInput): Promise<ClassifiedTaskTag[]> {
    this.inputs.push(input);
    return [];
  }
}
