import { FormEvent, useEffect, useRef, useState } from "react";
import type { Task } from "@porkpie/shared";
import { createTask, deleteTask, listTasks, updateTask } from "./api";
import type { TaskFilters } from "./api";
import { PaginationControls } from "./components/PaginationControls";
import { TaskFiltersForm } from "./components/TaskFiltersForm";
import { TaskForm } from "./components/TaskForm";
import { TaskList } from "./components/TaskList";
import "./styles.css";

export function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [debouncedSearchFilter, setDebouncedSearchFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [completionFilter, setCompletionFilter] = useState<TaskFilters["completed"]>("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [editingTags, setEditingTags] = useState("");
  const [error, setError] = useState<string | null>(null);
  const reloadRequestId = useRef(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchFilter(searchFilter);
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchFilter]);

  useEffect(() => {
    const controller = new AbortController();
    void reloadTasks(controller.signal);
    return () => controller.abort();
  }, [debouncedSearchFilter, tagFilter, completionFilter, page]);

  async function reloadTasks(signal?: AbortSignal) {
    const requestId = reloadRequestId.current + 1;
    reloadRequestId.current = requestId;

    try {
      setError(null);
      const loaded = await listTasks(
        {
          search: debouncedSearchFilter,
          tag: tagFilter,
          completed: completionFilter,
          page,
        },
        signal,
      );
      if (requestId !== reloadRequestId.current) return;
      setTasks(loaded.tasks);
      setTotal(loaded.total);
      setTotalPages(loaded.totalPages);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    }
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      await createTask({ title, description, tags: parseTags(tagInput) });
      await reloadTasks();
      setTitle("");
      setDescription("");
      setTagInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    }
  }

  async function handleToggle(task: Task) {
    setError(null);

    try {
      await updateTask(task.id, { completed: !task.completed });
      await reloadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    }
  }

  async function handleSave(task: Task) {
    setError(null);

    try {
      await updateTask(task.id, {
        title: editingTitle,
        description: editingDescription,
        tags: parseTags(editingTags),
      });
      setEditingId(null);
      await reloadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save task");
    }
  }

  async function handleDelete(task: Task) {
    setError(null);

    try {
      await deleteTask(task.id);
      if (tasks.length === 1 && page > 1) {
        setPage((current) => current - 1);
        return;
      }
      await reloadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
    }
  }

  function handleSearchFilterChange(value: string) {
    setSearchFilter(value);
  }

  function handleTagFilterChange(value: string) {
    setTagFilter(value);
    setPage(1);
  }

  function handleCompletionFilterChange(value: TaskFilters["completed"]) {
    setCompletionFilter(value);
    setPage(1);
  }

  function handleTagClick(tagName: string) {
    setTagFilter(tagName);
    setPage(1);
  }

  function startEditing(task: Task) {
    setEditingId(task.id);
    setEditingTitle(task.title);
    setEditingDescription(task.description ?? "");
    setEditingTags(task.tags.map((tag) => tag.name).join(", "));
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingTitle("");
    setEditingDescription("");
    setEditingTags("");
  }

  return (
    <main className="app-shell">
      <header>
        <p className="eyebrow">Porkpie</p>
        <h1>Tasks</h1>
        <p className="lede">A small TypeScript task app built to show clean end-to-end architecture.</p>
      </header>

      <TaskForm
        title={title}
        description={description}
        tagInput={tagInput}
        onTitleChange={setTitle}
        onDescriptionChange={setDescription}
        onTagInputChange={setTagInput}
        onSubmit={handleCreate}
      />

      <TaskFiltersForm
        searchFilter={searchFilter}
        tagFilter={tagFilter}
        completionFilter={completionFilter}
        onSearchFilterChange={handleSearchFilterChange}
        onTagFilterChange={handleTagFilterChange}
        onCompletionFilterChange={handleCompletionFilterChange}
      />

      {error ? <p className="error">{error}</p> : null}

      <PaginationControls
        page={page}
        total={total}
        totalPages={totalPages}
        onPreviousPage={() => setPage((current) => Math.max(1, current - 1))}
        onNextPage={() => setPage((current) => current + 1)}
      />

      <TaskList
        tasks={tasks}
        hasActiveFilters={Boolean(debouncedSearchFilter || tagFilter)}
        completionFilter={completionFilter}
        editingId={editingId}
        editingTitle={editingTitle}
        editingDescription={editingDescription}
        editingTags={editingTags}
        onToggle={(task) => void handleToggle(task)}
        onStartEditing={startEditing}
        onSave={(task) => void handleSave(task)}
        onCancelEditing={cancelEditing}
        onDelete={(task) => void handleDelete(task)}
        onEditingTitleChange={setEditingTitle}
        onEditingDescriptionChange={setEditingDescription}
        onEditingTagsChange={setEditingTags}
        onTagClick={handleTagClick}
      />
    </main>
  );
}

function parseTags(value: string): string[] {
  return [...new Set(value.split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
}
