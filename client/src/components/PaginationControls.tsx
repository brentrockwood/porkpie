type PaginationControlsProps = {
  page: number;
  total: number;
  totalPages: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
};

export function PaginationControls({ page, total, totalPages, onPreviousPage, onNextPage }: PaginationControlsProps) {
  return (
    <nav className="pagination" aria-label="Task pages">
      <button type="button" disabled={page <= 1} onClick={onPreviousPage}>
        Previous
      </button>
      <span>
        Page {page} of {totalPages} · {total} {total === 1 ? "task" : "tasks"}
      </span>
      <button type="button" disabled={page >= totalPages} onClick={onNextPage}>
        Next
      </button>
    </nav>
  );
}
