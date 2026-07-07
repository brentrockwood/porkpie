CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY,
  user_id text NOT NULL,
  title text NOT NULL CHECK (char_length(trim(title)) > 0),
  description text,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_created_at ON tasks (user_id, created_at DESC);
