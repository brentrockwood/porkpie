import type { KeyboardEvent } from "react";
import type { Task } from "@porkpie/shared";
import type { TaskFilters } from "../api";
import { Box, ButtonBase, Checkbox, Chip, IconButton, Paper, Stack, TextField, Typography } from "@mui/material";
import CancelIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Check";

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
    <Stack className="task-list" component="section" aria-label="Tasks" spacing={1.5}>
      {tasks.length === 0 ? (
        <Typography className="empty" color="text.secondary">
          {hasActiveFilters || completionFilter !== "all" ? "No tasks match the current filters." : "No tasks yet."}
        </Typography>
      ) : null}
      {tasks.map((task) => (
        <Paper className="task-card" component="article" elevation={2} key={task.id}>
          <Checkbox
            aria-label={`Mark ${task.title} ${task.completed ? "incomplete" : "complete"}`}
            checked={task.completed}
            onChange={() => onToggle(task)}
          />
          {editingId === task.id ? (
            <Box
              className="task-edit-form"
              component="form"
              onKeyDown={(event: KeyboardEvent<HTMLFormElement>) => handleEditKeyDown(event, task)}
              onSubmit={(event) => {
                event.preventDefault();
                onSave(task);
              }}
            >
              <Box className="task-content">
                <Stack className="edit-fields" spacing={1}>
                  <TextField aria-label="Task title" fullWidth value={editingTitle} onChange={(event) => onEditingTitleChange(event.target.value)} />
                  <TextField
                    aria-label="Task description"
                    fullWidth
                    multiline
                    minRows={2}
                    value={editingDescription}
                    onChange={(event) => onEditingDescriptionChange(event.target.value)}
                    placeholder="Optional details"
                  />
                  <TextField
                    aria-label="Task tags"
                    fullWidth
                    value={editingTags}
                    onChange={(event) => onEditingTagsChange(event.target.value)}
                    placeholder="Tags"
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
              <ButtonBase className="task-open-button" type="button" onClick={() => onStartEditing(task)}>
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
              </ButtonBase>
              <Stack className="task-actions" direction="row" spacing={0.5}>
                <IconButton aria-label="Delete task" color="error" type="button" onClick={() => onDelete(task)}>
                  <DeleteIcon />
                </IconButton>
              </Stack>
              {task.tags.length > 0 ? (
                <Box className="tags" component="ul" aria-label={`Tags for ${task.title}`}>
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
