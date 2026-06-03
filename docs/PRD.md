# Personal IP Content Workbench PRD

## Product Positioning

Personal IP Content Workbench is a local-first interactive content production coordinator.

It helps the user move from idea to confirmed topic, title, outline, draft generation, publication tracking, and review. It should become the control layer above existing content generation tools, not a replacement for every specialized script.

## Target User

The only target user for the MVP is the owner of this local workspace.

User profile:

- Product manager
- Creator developing a personal IP
- Focus areas: product thinking, AI tools, project management, personal growth, and self-media experiments
- Wants interactive confirmation before content production

## MVP Goal

Build a usable local workbench for the following loop:

1. Capture a topic idea.
2. Clarify the topic through interaction.
3. Confirm platform, content type, angle, title, and outline.
4. Call the existing content generation tool after confirmation.
5. Track generated assets and publication status.
6. Review performance after publishing.

## In Scope

- Topic management
- Interactive creation sessions
- Title candidate generation records
- Article outline records
- Short video script records
- Tool run records
- Publication records
- Review records
- Local data storage

## Out of Scope

- Login
- Payment
- Multi-user collaboration
- Cloud deployment
- Full automatic publishing
- Complex permission systems
- Complex analytics dashboards

## Core Workflow

```text
Idea input
-> topic clarification
-> topic confirmation
-> angle confirmation
-> title candidates
-> title confirmation
-> outline generation
-> outline confirmation
-> tool call preparation
-> draft generation
-> preview and manual review
-> publication record
-> performance review
```

## Core Entities

- `Topic`: a content idea and its current production status.
- `CreationSession`: one interactive content planning session.
- `TitleCandidate`: one possible title for a platform and style.
- `Outline`: a confirmed or draft article structure.
- `VideoScript`: short video hook, scenes, voiceover, and call to action.
- `ToolRun`: a record of a content generation command or tool invocation.
- `PublishRecord`: publication platform, link, and performance data.
- `ReviewRecord`: qualitative review and next-step suggestions.

## MVP Success Criteria

- The user can create, edit, delete, search, and filter topics.
- The user can start an interactive creation session for a topic.
- The user can confirm topic, angle, title, and outline before generation.
- The app can record the command or tool call used to generate content.
- The app can save generated Markdown and HTML output paths.
- The app can record publication metrics.
- The app can capture review notes and next actions.

## Existing Tool Integration

The first supported production target is WeChat official account article generation.

The workbench should treat the existing article generation project as an execution layer. The workbench owns:

- confirmed topic context
- title
- outline
- generation input
- tool run record
- output paths
- publication and review records

The existing tool owns:

- Markdown generation
- HTML preview generation
- WeChat draft upload when explicitly requested

