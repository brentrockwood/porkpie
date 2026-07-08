import { useEffect, useState } from "react";
import { Autocomplete, Badge, Button, Collapse, FormControlLabel, Paper, Stack, Switch, TextField } from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";

type TaskFiltersFormProps = {
  searchFilter: string;
  tagFilter: string;
  availableTags: string[];
  showCompleted: boolean;
  onSearchFilterChange: (value: string) => void;
  onTagFilterChange: (value: string) => void;
  onShowCompletedChange: (value: boolean) => void;
};

export function TaskFiltersForm({
  searchFilter,
  tagFilter,
  availableTags,
  showCompleted,
  onSearchFilterChange,
  onTagFilterChange,
  onShowCompletedChange,
}: TaskFiltersFormProps) {
  const [isOpen, setIsOpen] = useState(Boolean(searchFilter || tagFilter));
  const activeFilterCount = Number(Boolean(searchFilter)) + Number(Boolean(tagFilter));

  useEffect(() => {
    if (activeFilterCount > 0) setIsOpen(true);
  }, [activeFilterCount]);

  return (
    <Paper className="filters" component="section" elevation={0} aria-label="Task filters">
      <div className="filter-summary">
        <Badge badgeContent={activeFilterCount} color="primary" invisible={activeFilterCount === 0}>
          <Button aria-expanded={isOpen} onClick={() => setIsOpen((current) => !current)} startIcon={<FilterListIcon />} type="button" variant="outlined">
            Filter
          </Button>
        </Badge>
        <FormControlLabel
          className="switch-field"
          control={<Switch checked={showCompleted} onChange={(event) => onShowCompletedChange(event.target.checked)} />}
          label="Show completed"
        />
      </div>

      <Collapse in={isOpen} unmountOnExit>
        <Stack className="filter-panel" spacing={2}>
          <TextField
            fullWidth
            label="Search"
            onChange={(event) => onSearchFilterChange(event.target.value)}
            placeholder="Search tasks"
            value={searchFilter}
          />
          <Autocomplete
            freeSolo
            inputValue={tagFilter}
            onInputChange={(_event, value) => onTagFilterChange(value)}
            options={availableTags}
            renderInput={(params) => <TextField {...params} fullWidth label="Tag" placeholder="Filter by tag" />}
          />
        </Stack>
      </Collapse>
    </Paper>
  );
}
