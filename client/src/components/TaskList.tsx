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
          <div className="task-content">
            {editingId === task.id ? (
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
            ) : (
              <>
                <h2 className={task.completed ? "completed" : ""}>{task.title}</h2>
                {task.description ? <p>{task.description}</p> : null}
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
          </div>
          <div className="task-actions">
            {editingId === task.id ? (
              <>
                <button type="button" onClick={() => onSave(task)}>
                  Save
                </button>
                <button type="button" onClick={onCancelEditing}>
                  Cancel
                </button>
              </>
            ) : (
              <button type="button" onClick={() => onStartEditing(task)}>
                Edit
              </button>
            )}
            <button type="button" onClick={() => onDelete(task)}>
              Delete
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}
