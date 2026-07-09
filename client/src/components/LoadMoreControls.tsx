import { Box, Button, Typography } from "@mui/material";

type LoadMoreControlsProps = {
  hasMore: boolean;
  total: number;
  visibleCount: number;
  isLoading: boolean;
  onLoadMore: () => void;
};

export function LoadMoreControls({ hasMore, isLoading, total, visibleCount, onLoadMore }: LoadMoreControlsProps) {
  return (
    <Box className="load-more" component="nav" aria-label="More tasks">
      <Typography color="text.secondary" variant="body2">
        Showing {visibleCount} of {total} {total === 1 ? "task" : "tasks"}
      </Typography>
      {hasMore ? (
        <Button disabled={isLoading} type="button" onClick={onLoadMore} variant="outlined">
          {isLoading ? "Loading…" : "Load more"}
        </Button>
      ) : null}
    </Box>
  );
}
