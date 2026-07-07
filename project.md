# Project Porkpie

This is a demo TODO list app.

## Technical Stack

### Frontend

-   React
-   TypeScript
-   Vite

### Backend

-   Express
-   TypeScript

### Data

-   PostgreSQL (preferred)
-   SQLite acceptable if time constrained

### Infrastructure

-   Docker Compose

### Testing

-   Unit tests
-   API tests

## Core Features

-   Create/Edit/Delete tasks
-   Complete tasks
-   Tags
-   Search
-   Filtering

## AI Enhancement

On task creation:

-   Add tags
-   Return confidence score
-   Allow manual override
-   Persist classification metadata

Example:

Input: \> Buy milk

Output: 

  [
    {"tag":"shopping","confidence":0.95},
    {"tag":"grocery","confidence":0.91},
    {"tag":"dairy","confidence":0.8}
  ]

## Chat Integration

Support Telegram or Slack.

Messages become tasks through the same backend API used by the web UI.

## Architecture Principles

-   Small, composable modules
-   Clear separation of concerns
-   Boring technology, well executed
-   AI enhances rather than replaces traditional software
-   Readability over cleverness

## Suggested Repository

``` text
client/
server/
shared/
tests/
docs/
docker/
```

## Documentation

Include:

-   README
-   Architecture
-   Database schema
-   API overview
-   Local development
-   Testing strategy
-   Future enhancements

## Presentation Assets

Prepare Excalidraw diagrams for:

1.  System architecture
2.  Request lifecycle
3.  AI classification flow
4.  Chat integration
5.  Database model
6.  Deployment layout

## Demo Plan

1.  Architecture overview
2.  Repository tour
3.  Backend design
4.  Frontend organization
5.  Tests
6.  Live demo
7.  Chat-created task
8.  AI classification
9.  Design tradeoffs

## Out of Scope

-   Teams
-   Advanced auth
-   Realtime collaboration
-   Mobile
-   Electron
-   Calendar sync
-   Complex permissions

## Definition of Done

The repository should be representative of how a senior developer would build
a production-quality TypeScript application in 2026 and be suitable as a
long-term portfolio reference.
