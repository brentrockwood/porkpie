import { useEffect, useState } from "react";
import { Autocomplete, Badge, Box, Button, Collapse, FormControlLabel, IconButton, Paper, Stack, Switch, TextField, Tooltip } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
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

  function clearFilters() {
    onSearchFilterChange("");
    onTagFilterChange("");
  }

  return (
    <Paper className="filters" component="section" elevation={0} aria-label="Task filters">
      <div className="filter-summary">
        <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
          <Badge badgeContent={activeFilterCount} color="primary" invisible={activeFilterCount === 0}>
            <Button aria-expanded={isOpen} onClick={() => setIsOpen((current) => !current)} startIcon={<FilterListIcon />} type="button" variant="outlined">
              Filter
            </Button>
          </Badge>
          {activeFilterCount > 0 ? (
            <Tooltip title="Clear search and tag filters">
              <IconButton aria-label="Clear search and tag filters" onClick={clearFilters} size="small" type="button">
                <ClearIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null}
        </Box>
        <FormControlLabel
          className="switch-field"
          control={<Switch checked={showCompleted} onChange={(event) => onShowCompletedChange(event.target.checked)} />}
          label="Show completed"
        />
      </div>

      {activeFilterCount > 0 ? (
        <Box className="active-filter-chips" sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          {searchFilter ? (
            <Button className="search-filter-chip filter-chip" endIcon={<ClearIcon />} onClick={() => onSearchFilterChange("")} size="small" type="button" variant="outlined">
              Search: {searchFilter}
            </Button>
          ) : null}
          {tagFilter ? (
            <Button className="tag-filter-chip filter-chip" endIcon={<ClearIcon />} onClick={() => onTagFilterChange("")} size="small" type="button" variant="outlined">
              {tagFilter}
            </Button>
          ) : null}
        </Box>
      ) : null}

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
            isOptionEqualToValue={(option, value) => option === value}
            onChange={(_event, value) => onTagFilterChange(value ?? "")}
            options={availableTags}
            renderInput={(params) => <TextField {...params} fullWidth label="Tag" placeholder="Choose a tag" />}
            value={tagFilter || null}
          />
        </Stack>
      </Collapse>
    </Paper>
  );
}
