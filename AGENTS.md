# AGENTS.md

## Project Background

Personal IP Content Workbench is a local-first workspace for planning, producing, publishing, and reviewing personal media content.

The product is designed for a single user: a product manager building a personal IP around product thinking, AI tools, project management, personal growth, and self-media experiments.

This workbench should replace the current fully automated topic selection and daily article flow with an interactive creation workflow. The user confirms the topic, angle, title, and outline before any content generation tool is called.

## User Role

- Product manager
- Solo creator
- Works locally and prefers simple, inspectable workflows
- Wants the tool to support thinking, selection, confirmation, production, and review

## Product Goals

1. Manage content topics.
2. Interactively confirm topic direction and outline.
3. Generate title candidates, article outlines, and short video scripts.
4. Call existing content generation tools only after user confirmation.
5. Track publication status and performance data.
6. Record review insights for future topic decisions.

## Technical Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Local JSON storage for the first version
- SQLite can be introduced later if local JSON becomes limiting

## Code Standards

- Define all core domain data with TypeScript types.
- Prefer simple modules over complex architecture.
- Keep each change small and directly tied to the current task.
- Avoid premature abstractions.
- Keep tool integration behind adapter modules.
- Do not hard-code secrets, API keys, or private tokens.
- Store timestamps as ISO 8601 strings.
- Use clear Chinese labels in UI-facing constants and examples.

## UI Standards

- Build a quiet, practical, long-term work interface.
- The first screen should be the workbench, not a marketing page.
- Prioritize summary-first layouts and clear next actions.
- Use tables, filters, tabs, forms, and confirmation controls where appropriate.
- Do not make the interface visually noisy.
- Make every generation step editable and confirmable before moving forward.

## Testing Requirements

- Test core data transforms and status calculations.
- Test local storage read/write behavior once storage is implemented.
- Test content workflow transitions.
- Test tool command construction before enabling real execution.
- Prefer focused tests over broad end-to-end tests in the MVP.

## Task Execution Flow

For every development task:

1. Restate the goal and planned scope.
2. Inspect existing files before editing.
3. Make the smallest useful change.
4. Explain what changed after editing.
5. Run available checks when the project has a runnable setup.
6. Keep tool calls confirmable when they produce or publish content.

## Content Production Rule

The workbench must not default to fully automated article production.

Required flow:

1. Gather or create topic ideas.
2. Ask the user to confirm the chosen topic.
3. Ask the user to confirm the content angle.
4. Generate title candidates and ask for confirmation.
5. Generate an outline and ask for confirmation.
6. Only then call content generation tools.
7. Show generated file paths, command logs, and review actions.

