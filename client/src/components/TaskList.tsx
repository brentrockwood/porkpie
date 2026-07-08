import type { KeyboardEvent, MouseEvent } from "react";
import type { Task } from "@porkpie/shared";
import type { TaskFilters } from "../api";
import { Box, Checkbox, Chip, IconButton, Paper, Stack, TextField, Typography } from "@mui/material";
import CancelIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import SaveIcon from "@mui/icons-material/Check";
import { TagAutocomplete } from "./TagAutocomplete";

type TaskListProps = {
  tasks: Task[];
  hasActiveFilters: boolean;
  completionFilter: TaskFilters["completed"];
  editingId: string | null;
  editingTitle: string;
  editingDescription: string;
  editingTags: string;
  availableTags: string[];
  onToggle: (task: Task) => void;
  onStartEditing: (task: Task) => void;
  onSave: (task: Task, tagsOverride?: string) => void;
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
  availableTags,
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

  function stopCardEdit(event: MouseEvent) {
    event.stopPropagation();
  }

  return (
    <Stack className="task-list" component="section" aria-label="Tasks" spacing={1.5}>
      {tasks.length === 0 ? (
        <Typography className="empty" color="text.secondary">
          {hasActiveFilters || completionFilter !== "all" ? "No tasks match the current filters." : "No tasks yet."}
        </Typography>
      ) : null}
      {tasks.map((task) => (
        <Paper
          className="task-card"
          component="article"
          elevation={2}
          key={task.id}
          onClick={editingId === task.id ? undefined : () => onStartEditing(task)}
          role={editingId === task.id ? undefined : "button"}
          tabIndex={editingId === task.id ? undefined : 0}
          onKeyDown={
            editingId === task.id
              ? undefined
              : (event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onStartEditing(task);
                  }
                }
          }
        >
          <Checkbox
            aria-label={`Mark ${task.title} ${task.completed ? "incomplete" : "complete"}`}
            checked={task.completed}
            checkedIcon={<CheckCircleIcon />}
            icon={<RadioButtonUncheckedIcon />}
            onClick={stopCardEdit}
            onKeyDown={(event) => event.stopPropagation()}
            onChange={() => onToggle(task)}
          />
          {editingId === task.id ? (
            <Box
              className="task-edit-form"
              component="form"
              onClick={stopCardEdit}
              onKeyDown={(event: KeyboardEvent<HTMLFormElement>) => handleEditKeyDown(event, task)}
              onSubmit={(event) => {
                event.preventDefault();
                onSave(task);
              }}
            >
              <Box className="task-content">
                <Stack className="edit-fields" spacing={1}>
                  <TextField fullWidth label="Title" value={editingTitle} onChange={(event) => onEditingTitleChange(event.target.value)} />
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    minRows={2}
                    value={editingDescription}
                    onChange={(event) => onEditingDescriptionChange(event.target.value)}
                    placeholder="Optional details"
                  />
                  <TagAutocomplete
                    availableTags={availableTags}
                    label="Tags"
                    onChange={onEditingTagsChange}
                    onEnter={(nextTags) => onSave(task, nextTags)}
                    placeholder="Tags"
                    value={editingTags}
                  />
                </Stack>
              </Box>
              <Stack className="task-actions" direction="row" spacing={0.5}>
                <IconButton aria-label="Save task" color="primary" type="submit">
                  <SaveIcon />
                </IconButton>
                <IconButton aria-label="Cancel editing" type="button" onClick={onCancelEditing}>
                  <CancelIcon />
                </IconButton>
                <IconButton aria-label="Delete task" color="error" type="button" onClick={() => onDelete(task)}>
                  <DeleteIcon />
                </IconButton>
              </Stack>
            </Box>
          ) : (
            <>
              <Box className="task-open-button">
                <Box className="task-content">
                  <Typography className={task.completed ? "completed" : ""} component="h2" variant="subtitle1">
                    {task.title}
                  </Typography>
                  {task.description ? (
                    <Typography color="text.secondary" variant="body2">
                      {task.description}
                    </Typography>
                  ) : null}
                </Box>
              </Box>
              <Stack className="task-actions" direction="row" spacing={0.5} onClick={stopCardEdit} onKeyDown={(event) => event.stopPropagation()}>
                <IconButton aria-label="Delete task" color="error" type="button" onClick={() => onDelete(task)}>
                  <DeleteIcon />
                </IconButton>
              </Stack>
              {task.tags.length > 0 ? (
                <Box className="tags" component="ul" aria-label={`Tags for ${task.title}`} onClick={stopCardEdit} onKeyDown={(event) => event.stopPropagation()}>
                  {task.tags.map((tag) => (
                    <li key={`${tag.source}:${tag.name}`}>
                      <Chip component="button" label={tag.name} onClick={() => onTagClick(tag.name)} size="small" />
                    </li>
                  ))}
                </Box>
              ) : null}
            </>
          )}
        </Paper>
      ))}
    </Stack>
  );
}
