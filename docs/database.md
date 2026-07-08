# Database

Porkpie uses PostgreSQL with SQL migrations in `server/migrations`.

## Tables

### `schema_migrations`

Tracks applied migration filenames.

### `tasks`

```text
id          uuid primary key
user_id     text not null
title       text not null
description text nullable
completed   boolean not null default false
created_at  timestamptz not null default now()
updated_at  timestamptz not null default now()
```

`user_id` is present from the beginning so the service boundary already models ownership, even though the current app uses a demo auth context.

### `tags`

```text
id   uuid primary key
name text not null unique
```

Tag names are normalized to lower-case in the service layer.

### `task_tags`

```text
task_id    uuid not null references tasks(id) on delete cascade
tag_id     uuid not null references tags(id) on delete cascade
source     text not null: manual | ai
confidence numeric nullable, 0..1
created_at timestamptz not null default now()
```

`source` and `confidence` are included now so future AI classification can use the same tag model as manual tagging instead of introducing a parallel concept.
