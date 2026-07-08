import type { CreateTaskRequest, Task, TaskListResponse, UpdateTaskRequest } from "@porkpie/shared";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export type TaskFilters = {
  search?: string;
  tag?: string;
  completed?: "all" | "complete" | "incomplete";
  page?: number;
};

export async function listTasks(filters: TaskFilters = {}): Promise<TaskListResponse> {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.tag) params.set("tag", filters.tag);
  if (filters.completed === "complete") params.set("completed", "true");
  if (filters.completed === "incomplete") params.set("completed", "false");
  if (filters.page) params.set("page", String(filters.page));

  const query = params.toString();
  const response = await fetch(`${apiBaseUrl}/api/tasks${query ? `?${query}` : ""}`);
  await ensureOk(response);
  return (await response.json()) as TaskListResponse;
}

export async function createTask(input: CreateTaskRequest): Promise<Task> {
  const response = await fetch(`${apiBaseUrl}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  await ensureOk(response);
  return ((await response.json()) as { task: Task }).task;
}

export async function updateTask(id: string, input: UpdateTaskRequest): Promise<Task> {
  const response = await fetch(`${apiBaseUrl}/api/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  await ensureOk(response);
  return ((await response.json()) as { task: Task }).task;
}

export async function deleteTask(id: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/tasks/${id}`, { method: "DELETE" });
  await ensureOk(response);
}

async function ensureOk(response: Response): Promise<void> {
  if (response.ok) return;

  let message = `Request failed with status ${response.status}`;
  try {
    const body = (await response.json()) as { error?: string };
    if (body.error) message = body.error;
  } catch {
    // Keep generic message.
  }

  throw new Error(message);
}
