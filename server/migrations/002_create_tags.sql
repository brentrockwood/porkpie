CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY,
  name text NOT NULL UNIQUE CHECK (char_length(trim(name)) > 0)
);

CREATE TABLE IF NOT EXISTS task_tags (
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  source text NOT NULL CHECK (source IN ('manual', 'ai')),
  confidence numeric CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (task_id, tag_id, source)
);

CREATE INDEX IF NOT EXISTS idx_task_tags_tag_id ON task_tags (tag_id);
