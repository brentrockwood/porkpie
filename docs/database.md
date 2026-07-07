# Database

Phase 1 uses PostgreSQL with SQL migrations in `server/migrations`.

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

`user_id` is present from the beginning so the service boundary already models ownership, even though Phase 1 uses a demo auth context.

## Future schema direction

Phase 2 will likely add normalized tags:

```text
tags
task_tags
```

The tag join table is the natural place to store source and confidence metadata for AI-generated classifications.
