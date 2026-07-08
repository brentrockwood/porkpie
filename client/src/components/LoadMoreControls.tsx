import { Box, Button, Typography } from "@mui/material";

type LoadMoreControlsProps = {
  hasMore: boolean;
  total: number;
  visibleCount: number;
  onLoadMore: () => void;
};

export function LoadMoreControls({ hasMore, total, visibleCount, onLoadMore }: LoadMoreControlsProps) {
  return (
    <Box className="load-more" component="nav" aria-label="More tasks">
      <Typography color="text.secondary" variant="body2">
        Showing {visibleCount} of {total} {total === 1 ? "task" : "tasks"}
      </Typography>
      {hasMore ? (
        <Button type="button" onClick={onLoadMore} variant="outlined">
          Load more
        </Button>
      ) : null}
    </Box>
  );
}
