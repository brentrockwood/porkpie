import type { KeyboardEvent } from "react";
import type { Task } from "@porkpie/shared";
import type { TaskFilters } from "../api";

type TaskListProps = {
  tasks: Task[];
  hasActiveFilters: boolean;
  completionFilter: TaskFilters["completed"];
  editingId: string | null;
  editingTitle: string;
  editingDescription: string;
  editingTags: string;
  onToggle: (task: Task) => void;
  onStartEditing: (task: Task) => void;
  onSave: (task: Task) => void;
  onCancelEditing: () => void;
  onDelete: (task: Task) => void;
  onEditingTitleChange: (value: string) => void;
  onEditingDescriptionChange: (value: string) => void;
  onEditingTagsChange: (value: string) => void;
  onTagClick: (tagName: string) => void;
};

export function TaskList({
  tasks,
  hasActiveFilters,
  completionFilter,
  editingId,
  editingTitle,
  editingDescription,
  editingTags,
  onToggle,
  onStartEditing,
  onSave,
  onCancelEditing,
  onDelete,
  onEditingTitleChange,
  onEditingDescriptionChange,
  onEditingTagsChange,
  onTagClick,
}: TaskListProps) {
  function handleEditKeyDown(event: KeyboardEvent<HTMLFormElement>, task: Task) {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancelEditing();
      return;
    }

    if (event.key === "Enter" && event.target instanceof HTMLTextAreaElement) {
      event.preventDefault();
      onSave(task);
    }
  }

  return (
    <section className="task-list" aria-label="Tasks">
      {tasks.length === 0 ? (
        <p className="empty">
          {hasActiveFilters || completionFilter !== "all" ? "No tasks match the current filters." : "No tasks yet."}
        </p>
      ) : null}
      {tasks.map((task) => (
        <article className="task-card" key={task.id}>
          <input
            aria-label={`Mark ${task.title} ${task.completed ? "incomplete" : "complete"}`}
            checked={task.completed}
            onChange={() => onToggle(task)}
            type="checkbox"
          />
          {editingId === task.id ? (
            <form
              className="task-edit-form"
              onKeyDown={(event) => handleEditKeyDown(event, task)}
              onSubmit={(event) => {
                event.preventDefault();
                onSave(task);
              }}
            >
              <div className="task-content">
                <div className="edit-fields">
                  <input aria-label="Task title" value={editingTitle} onChange={(event) => onEditingTitleChange(event.target.value)} />
                  <textarea
                    aria-label="Task description"
                    value={editingDescription}
                    onChange={(event) => onEditingDescriptionChange(event.target.value)}
                    placeholder="Optional details"
                  />
                  <input
                    aria-label="Task tags"
                    value={editingTags}
                    onChange={(event) => onEditingTagsChange(event.target.value)}
                    placeholder="Tags"
                  />
                </div>
              </div>
              <div className="task-actions">
                <button aria-label="Save task" className="icon-button" type="submit">
                  ✓
                </button>
                <button aria-label="Cancel editing" className="icon-button" type="button" onClick={onCancelEditing}>
                  ✕
                </button>
                <button aria-label="Delete task" className="icon-button danger" type="button" onClick={() => onDelete(task)}>
                  🗑
                </button>
              </div>
            </form>
          ) : (
            <>
              <button className="task-open-button" type="button" onClick={() => onStartEditing(task)}>
                <span className="task-content">
                  <h2 className={task.completed ? "completed" : ""}>{task.title}</h2>
                  {task.description ? <p>{task.description}</p> : null}
                </span>
              </button>
              <div className="task-actions">
                <button aria-label="Delete task" className="icon-button danger" type="button" onClick={() => onDelete(task)}>
                  🗑
                </button>
              </div>
              {task.tags.length > 0 ? (
                <ul className="tags" aria-label={`Tags for ${task.title}`}>
                  {task.tags.map((tag) => (
                    <li key={`${tag.source}:${tag.name}`}>
                      <button type="button" onClick={() => onTagClick(tag.name)}>
                        {tag.name}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          )}
        </article>
      ))}
    </section>
  );
}
