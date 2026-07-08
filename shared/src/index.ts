export type TaskTag = {
  name: string;
  source: "manual" | "ai";
  confidence: number | null;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  tags: TaskTag[];
  createdAt: string;
  updatedAt: string;
};

export type CreateTaskRequest = {
  title: string;
  description?: string | null;
  tags?: string[];
};

export type UpdateTaskRequest = {
  title?: string;
  description?: string | null;
  completed?: boolean;
  tags?: string[];
};

export type TaskListResponse = {
  tasks: Task[];
};
