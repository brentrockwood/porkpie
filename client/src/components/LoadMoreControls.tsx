type LoadMoreControlsProps = {
  hasMore: boolean;
  total: number;
  visibleCount: number;
  onLoadMore: () => void;
};

export function LoadMoreControls({ hasMore, total, visibleCount, onLoadMore }: LoadMoreControlsProps) {
  return (
    <nav className="load-more" aria-label="More tasks">
      <span>
        Showing {visibleCount} of {total} {total === 1 ? "task" : "tasks"}
      </span>
      {hasMore ? (
        <button type="button" onClick={onLoadMore}>
          Load more
        </button>
      ) : null}
    </nav>
  );
}
