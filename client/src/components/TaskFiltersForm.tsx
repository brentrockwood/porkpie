import type { TaskFilters } from "../api";

type TaskFiltersFormProps = {
  searchFilter: string;
  tagFilter: string;
  completionFilter: TaskFilters["completed"];
  onSearchFilterChange: (value: string) => void;
  onTagFilterChange: (value: string) => void;
  onCompletionFilterChange: (value: TaskFilters["completed"]) => void;
};

export function TaskFiltersForm({
  searchFilter,
  tagFilter,
  completionFilter,
  onSearchFilterChange,
  onTagFilterChange,
  onCompletionFilterChange,
}: TaskFiltersFormProps) {
  return (
    <section className="filters" aria-label="Task filters">
      <label>
        Search
        <input value={searchFilter} onChange={(event) => onSearchFilterChange(event.target.value)} placeholder="Search tasks" />
      </label>
      <label>
        Tag
        <input value={tagFilter} onChange={(event) => onTagFilterChange(event.target.value)} placeholder="Filter by tag" />
      </label>
      <label>
        Status
        <select
          value={completionFilter}
          onChange={(event) => onCompletionFilterChange(event.target.value as TaskFilters["completed"])}
        >
          <option value="all">All</option>
          <option value="incomplete">Incomplete</option>
          <option value="complete">Complete</option>
        </select>
      </label>
    </section>
  );
}
