export type Task = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateTaskRequest = {
  title: string;
  description?: string | null;
};

export type UpdateTaskRequest = {
  title?: string;
  description?: string | null;
  completed?: boolean;
};

export type TaskListResponse = {
  tasks: Task[];
};
