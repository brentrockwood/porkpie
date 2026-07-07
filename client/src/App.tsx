import { FormEvent, useEffect, useState } from "react";
import type { Task } from "@porkpie/shared";
import { createTask, deleteTask, listTasks, updateTask } from "./api";
import "./styles.css";

export function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listTasks().then(setTasks).catch((err: Error) => setError(err.message));
  }, []);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      const task = await createTask({ title, description });
      setTasks((current) => [task, ...current]);
      setTitle("");
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    }
  }

  async function handleToggle(task: Task) {
    const updated = await updateTask(task.id, { completed: !task.completed });
    setTasks((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  }

  async function handleSave(task: Task) {
    const updated = await updateTask(task.id, { title: editingTitle });
    setTasks((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    setEditingId(null);
  }

  async function handleDelete(task: Task) {
    await deleteTask(task.id);
    setTasks((current) => current.filter((item) => item.id !== task.id));
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
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Buy milk" />
        </label>
        <label>
          Description
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Optional details"
          />
        </label>
        <button type="submit">Create task</button>
      </form>

      {error ? <p className="error">{error}</p> : null}

      <section className="task-list" aria-label="Tasks">
        {tasks.length === 0 ? <p className="empty">No tasks yet.</p> : null}
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
                <input value={editingTitle} onChange={(event) => setEditingTitle(event.target.value)} />
              ) : (
                <h2 className={task.completed ? "completed" : ""}>{task.title}</h2>
              )}
              {task.description ? <p>{task.description}</p> : null}
            </div>
            <div className="task-actions">
              {editingId === task.id ? (
                <button type="button" onClick={() => void handleSave(task)}>
                  Save
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(task.id);
                    setEditingTitle(task.title);
                  }}
                >
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
