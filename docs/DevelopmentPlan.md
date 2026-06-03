# Development Plan

## Phase 1: Documentation And Types

Goal:

- Create the product documentation.
- Define core TypeScript domain types.
- Keep the project lightweight and implementation-ready.

Deliverables:

- `AGENTS.md`
- `docs/PRD.md`
- `docs/UI.md`
- `docs/ContentStrategy.md`
- `docs/DevelopmentPlan.md`
- `src/types/content.ts`
- `src/types/workflow.ts`
- `src/types/tool.ts`

## Phase 2: Project Bootstrap

Goal:

- Initialize a Next.js, React, TypeScript, and Tailwind CSS app.
- Keep the app local-first.

Deliverables:

- `package.json`
- Next.js app structure
- Tailwind configuration
- Basic layout
- Local development command

## Phase 3: Local Storage

Goal:

- Implement local JSON storage for topics, sessions, tool runs, publish records, and review records.

Deliverables:

- Storage module
- Seed data
- Basic read/write helpers
- Tests for storage helpers

## Phase 4: Creation Chat MVP

Goal:

- Build the main interactive workflow.

Deliverables:

- Creation chat page
- Step-by-step confirmation flow
- Topic confirmation
- Angle confirmation
- Title candidate review
- Outline review
- Prepared generation summary

## Phase 5: Topic Library

Goal:

- Manage and inspect content topics.

Deliverables:

- Topic list
- Search
- Filters
- Topic create/edit/delete
- Topic detail page

## Phase 6: Tool Adapter

Goal:

- Connect confirmed content input to existing generation tools.

Deliverables:

- Tool adapter interface
- WeChat article generation adapter
- Manual command preview
- Tool run records
- Output file path records

The first implementation may stop at command preview and manual execution. Real execution can be enabled after command construction and error handling are tested.

## Phase 7: Publication And Review

Goal:

- Record publication performance and review insights.

Deliverables:

- Publish record form
- Review record form
- Simple performance summary
- Topic-level review history

## Development Principles

- Build the smallest usable workflow first.
- Keep all generation steps confirmable.
- Do not automate publishing by default.
- Prefer local data and inspectable files.
- Add tests where logic can regress.

