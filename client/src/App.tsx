import { FormEvent, useEffect, useState } from "react";
import type { Task } from "@porkpie/shared";
import { createTask, deleteTask, listTasks, updateTask } from "./api";
import type { TaskFilters } from "./api";
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
    try {
      setError(null);
      const loaded = await listTasks({
        search: debouncedSearchFilter,
        tag: tagFilter,
        completed: completionFilter,
        page,
      }, signal);
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
      await reloadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
    }
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

      <form className="task-form" onSubmit={handleCreate}>
        <label>
          Title
          <input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Buy milk" />
        </label>
        <label>
          Description
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Optional details"
          />
        </label>
        <label>
          Tags
          <input value={tagInput} onChange={(event) => setTagInput(event.target.value)} placeholder="shopping, grocery" />
        </label>
        <button type="submit">Create task</button>
      </form>

      <section className="filters" aria-label="Task filters">
        <label>
          Search
          <input
            value={searchFilter}
            onChange={(event) => {
              setSearchFilter(event.target.value);
              setPage(1);
            }}
            placeholder="Search tasks"
          />
        </label>
        <label>
          Tag
          <input
            value={tagFilter}
            onChange={(event) => {
              setTagFilter(event.target.value);
              setPage(1);
            }}
            placeholder="Filter by tag"
          />
        </label>
        <label>
          Status
          <select
            value={completionFilter}
            onChange={(event) => {
              setCompletionFilter(event.target.value as TaskFilters["completed"]);
              setPage(1);
            }}
          >
            <option value="all">All</option>
            <option value="incomplete">Incomplete</option>
            <option value="complete">Complete</option>
          </select>
        </label>
      </section>

      {error ? <p className="error">{error}</p> : null}

      <nav className="pagination" aria-label="Task pages">
        <button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
          Previous
        </button>
        <span>
          Page {page} of {totalPages} · {total} tasks
        </span>
        <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>
          Next
        </button>
      </nav>

      <section className="task-list" aria-label="Tasks">
        {tasks.length === 0 ? (
          <p className="empty">
            {debouncedSearchFilter || tagFilter || completionFilter !== "all" ? "No tasks match the current filters." : "No tasks yet."}
          </p>
        ) : null}
        {tasks.map((task) => (
          <article className="task-card" key={task.id}>
            <input
              aria-label={`Mark ${task.title} ${task.completed ? "incomplete" : "complete"}`}
              checked={task.completed}
              onChange={() => void handleToggle(task)}
              type="checkbox"
            />
            <div className="task-content">
              {editingId === task.id ? (
                <div className="edit-fields">
                  <input aria-label="Task title" value={editingTitle} onChange={(event) => setEditingTitle(event.target.value)} />
                  <textarea
                    aria-label="Task description"
                    value={editingDescription}
                    onChange={(event) => setEditingDescription(event.target.value)}
                    placeholder="Optional details"
                  />
                  <input aria-label="Task tags" value={editingTags} onChange={(event) => setEditingTags(event.target.value)} placeholder="Tags" />
                </div>
              ) : (
                <>
                  <h2 className={task.completed ? "completed" : ""}>{task.title}</h2>
                  {task.description ? <p>{task.description}</p> : null}
                  {task.tags.length > 0 ? (
                    <ul className="tags" aria-label={`Tags for ${task.title}`}>
                      {task.tags.map((tag) => (
                        <li key={`${tag.source}:${tag.name}`}>
                          <button
                            type="button"
                            onClick={() => {
                              setTagFilter(tag.name);
                              setPage(1);
                            }}
                          >
                            {tag.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </>
              )}
            </div>
            <div className="task-actions">
              {editingId === task.id ? (
                <>
                  <button type="button" onClick={() => void handleSave(task)}>
                    Save
                  </button>
                  <button type="button" onClick={cancelEditing}>
                    Cancel
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => startEditing(task)}>
                  Edit
                </button>
              )}
              <button type="button" onClick={() => void handleDelete(task)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

function parseTags(value: string): string[] {
  return [...new Set(value.split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
}
