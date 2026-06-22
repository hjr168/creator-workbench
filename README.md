# 今日可写 / Personal IP Content Workbench

一个本地优先的公众号 AI 选题雷达 MVP：从 AIHOT REST API 拉取 AI 热点，标准化入库并按 `provider_item_id / url / content_hash` 去重，然后进行 HKR 评分，生成公众号选题卡和 Markdown 选题日报。

## Current Phase

MVP: Next.js App Router + TypeScript + Tailwind CSS + 本地 JSON 持久化。

主要入口：

- `/` 今日高分选题，支持按账号类型重排。
- `/topics` 选题列表，支持账号类型和推荐级别筛选。
- `/topics/[id]` 完整选题卡，包含原文链接、来源、发布时间和事实核对提示。
- `/hkr` HKR 评分方法说明页。
- `/admin-login` 管理后台登录入口（普通用户导航中不暴露）。
- `/admin` 受密码保护的管理后台（手动拉取 AIHOT、查看拉取日志、重新评分、生成 Markdown 日报），未登录访问会跳转到 `/admin-login`。

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Miniapp MVP

The WeChat mini program lives in `miniapp/`. It is a read-only mobile MVP for:

- 今日可写
- 选题库
- 选题详情
- 选题日报

Run the Next backend first, then build the miniapp:

```bash
npm run dev
npm run miniapp:install
npm run miniapp:dev
```

Open `miniapp/` in WeChat DevTools. The default API base is `http://127.0.0.1:3000`; override it with `TARO_APP_API_BASE` when building for another backend.

Miniapp API endpoints:

- `GET /api/miniapp/topics?account=&level=&limit=`
- `GET /api/miniapp/topics/:id?account=`
- `GET /api/miniapp/daily-report/latest`

## Admin Access

The `/admin` panel is password-protected and hidden from regular users.

1. Set `ADMIN_PASSWORD` (and optionally `ADMIN_COOKIE_SECRET`) in `.env.local`.
2. Visit `/admin-login` and sign in.
3. Unauthenticated visits to `/admin` are redirected to `/admin-login`.

Without `ADMIN_PASSWORD`, the admin panel is effectively locked (login always fails). Configure it before exposing the app publicly.

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
