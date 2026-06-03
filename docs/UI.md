# UI Plan

## Design Direction

The UI should feel like a practical local operating desk for one creator. It should be quiet, clear, and suitable for daily use.

Do not build a landing page for the MVP. The first screen should show work in progress and the next content action.

## Navigation

Primary sections:

- Home
- Creation Chat
- Topic Library
- Topic Detail
- Tool Runs
- Review

## Home

Purpose: show the creator what needs attention today.

Content:

- Active creation session
- Topics waiting for confirmation
- Topics waiting for outline
- Recent generated drafts
- Published content waiting for review
- Simple counts: total topics, pending creation, published, reviewed

Primary action:

- Start a creation session

## Creation Chat

Purpose: guide the user through topic and outline confirmation before generation.

Layout:

- Left: conversation and prompts
- Right: current topic card, confirmed decisions, and next action

Required interaction steps:

1. Confirm topic.
2. Confirm target platform.
3. Confirm content type.
4. Confirm angle.
5. Review title candidates.
6. Confirm or edit title.
7. Review outline.
8. Confirm or edit outline.
9. Prepare tool run.

Important controls:

- Confirm
- Edit
- Regenerate
- Save as topic
- Prepare generation

## Topic Library

Purpose: manage all topics.

Content:

- Search box
- Platform filter
- Content type filter
- Status filter
- Tag filter
- Topic list or table

Table columns:

- Title
- Direction
- Platform
- Content type
- Status
- Tags
- Created time
- Updated time

## Topic Detail

Purpose: show the full lifecycle of one topic.

Sections:

- Basic information
- Creation sessions
- Title candidates
- Outline
- Video script
- Tool runs
- Generated assets
- Publication records
- Review records

## Tool Runs

Purpose: make generation tool calls inspectable.

Content:

- Tool name
- Status
- Input summary
- Command preview
- Output files
- Error message
- Created time

The MVP can show manual command instructions before real execution is implemented.

## Review

Purpose: help the user find repeatable content patterns.

Content:

- Performance by platform
- Performance by content type
- Performance by topic direction
- Best performing titles
- Review notes
- Next improvement suggestions

## UI Principles

- Every AI or tool-generated output must be editable.
- Every production step must be confirmable.
- Avoid visual decoration that does not support decision making.
- Use clear empty states.
- Prefer readable tables and structured panels.
- Keep Chinese labels consistent with the user's workflow.

