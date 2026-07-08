import { useEffect, useState } from "react";

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
    <section className="filters" aria-label="Task filters">
      <div className="filter-summary">
        <button type="button" aria-expanded={isOpen} onClick={() => setIsOpen((current) => !current)}>
          Filter{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ""}
        </button>
        <label className="switch-field">
          <span>Show completed</span>
          <input checked={showCompleted} onChange={(event) => onShowCompletedChange(event.target.checked)} type="checkbox" />
        </label>
      </div>

      {isOpen ? (
        <div className="filter-panel">
          <label>
            Search
            <input value={searchFilter} onChange={(event) => onSearchFilterChange(event.target.value)} placeholder="Search tasks" />
          </label>
          <label>
            Tag
            <input
              list="tag-filter-options"
              value={tagFilter}
              onChange={(event) => onTagFilterChange(event.target.value)}
              placeholder="Filter by tag"
            />
            <datalist id="tag-filter-options">
              {availableTags.map((tag) => (
                <option key={tag} value={tag} />
              ))}
            </datalist>
          </label>
        </div>
      ) : null}
    </section>
  );
}
