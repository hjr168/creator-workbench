# 今日可写 / Personal IP Content Workbench

一个本地优先的公众号 AI 选题雷达 MVP：从 AIHOT REST API 拉取 AI 热点，标准化入库并按 `provider_item_id / url / content_hash` 去重，然后进行 HKR 评分，生成公众号选题卡和 Markdown 选题日报。

## Current Phase

MVP: Next.js App Router + TypeScript + Tailwind CSS + 本地 JSON 持久化。

主要入口：

- `/` 今日高分选题，支持按账号类型重排。
- `/topics` 选题列表，支持账号类型和推荐级别筛选。
- `/topics/[id]` 完整选题卡，包含原文链接、来源、发布时间和事实核对提示。
- `/admin` 手动拉取 AIHOT、查看拉取日志、重新评分、生成 Markdown 日报。

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## AIHOT Fetch

后台页面支持以下参数：

- `mode`: `selected` 或 `all`
- `category`: 如 `ai-products`、`paper`、`industry`
- `q`: 关键词搜索
- `since`: ISO-8601 时间窗口
- `limit`: 拉取数量

也可以通过接口触发：

```bash
curl -X POST http://localhost:3000/api/jobs/fetch-aihot \
  -H 'content-type: application/json' \
  -H 'x-job-secret: <TOPIC_RADAR_JOB_SECRET>' \
  -d '{"mode":"selected","limit":30}'
```

## Data

当前 MVP 不依赖外部数据库，运行数据保存在：

```text
src/data/topic-radar.json
```

后续迁移数据库可参考：

```text
docs/database-schema.sql
```

## LLM Generation

如果配置 `OPENAI_API_KEY`，选题卡会优先使用 LLM 生成；未配置时自动使用本地启发式生成器兜底。无论哪种方式，选题卡都不会把上游摘要直接作为最终内容，并会保留原文链接、来源和发布时间。

## Core Principle

Content generation must follow confirmation:

```text
idea -> topic -> angle -> title -> outline -> confirmed input -> tool generation
```
