import type { FormEvent } from "react";

type TaskFormProps = {
  title: string;
  description: string;
  tagInput: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onTagInputChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
};

export function TaskForm({
  title,
  description,
  tagInput,
  onTitleChange,
  onDescriptionChange,
  onTagInputChange,
  onSubmit,
}: TaskFormProps) {
  return (
    <form className="task-form" onSubmit={onSubmit}>
      <label>
        Title
        <input autoFocus value={title} onChange={(event) => onTitleChange(event.target.value)} placeholder="Buy milk" />
      </label>
      <label>
        Description
        <textarea value={description} onChange={(event) => onDescriptionChange(event.target.value)} placeholder="Optional details" />
      </label>
      <label>
        Tags
        <input value={tagInput} onChange={(event) => onTagInputChange(event.target.value)} placeholder="shopping, grocery" />
      </label>
      <button type="submit">Create task</button>
    </form>
  );
}
