type TaskFiltersFormProps = {
  searchFilter: string;
  tagFilter: string;
  showCompleted: boolean;
  onSearchFilterChange: (value: string) => void;
  onTagFilterChange: (value: string) => void;
  onShowCompletedChange: (value: boolean) => void;
};

export function TaskFiltersForm({
  searchFilter,
  tagFilter,
  showCompleted,
  onSearchFilterChange,
  onTagFilterChange,
  onShowCompletedChange,
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
      <label className="switch-field">
        <span>Show completed</span>
        <input checked={showCompleted} onChange={(event) => onShowCompletedChange(event.target.checked)} type="checkbox" />
      </label>
    </section>
  );
}
