import type { FormEvent } from "react";
import { Button, Paper, Stack, TextField } from "@mui/material";
import { TagAutocomplete } from "./TagAutocomplete";

type TaskFormProps = {
  title: string;
  description: string;
  tagInput: string;
  availableTags: string[];
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onTagInputChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
};

export function TaskForm({
  title,
  description,
  tagInput,
  availableTags,
  onTitleChange,
  onDescriptionChange,
  onTagInputChange,
  onSubmit,
}: TaskFormProps) {
  return (
    <Paper className="task-form" component="form" elevation={2} onSubmit={onSubmit}>
      <Stack spacing={2}>
        <TextField
          autoFocus
          fullWidth
          label="Title"
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="Buy milk"
          value={title}
        />
        <TextField
          fullWidth
          label="Description"
          multiline
          minRows={2}
          onChange={(event) => onDescriptionChange(event.target.value)}
          placeholder="Optional details"
          value={description}
        />
        <TagAutocomplete
          availableTags={availableTags}
          label="Tags"
          onChange={onTagInputChange}
          placeholder="shopping, grocery"
          value={tagInput}
        />
        <Button fullWidth type="submit" variant="contained">
          Create task
        </Button>
      </Stack>
    </Paper>
  );
}
