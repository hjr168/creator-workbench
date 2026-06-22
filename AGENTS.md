# AGENTS.md

## Project

今日可写 — 本地优先的公众号 AI 选题雷达。单人使用的 Next.js App Router 应用，从 AIHOT 拉取热点 → HKR 评分 → 生成选题卡和日报。

技术栈：Next.js (standalone output) + TypeScript (strict) + Tailwind CSS v4 + lucide-react。

## Commands

```bash
npm run dev          # 开发服务器 localhost:3000
npm run lint         # eslint (next core-web-vitals + typescript)
npm run typecheck    # tsc --noEmit
npm run build        # next build + standalone prepare
npm run db:migrate   # JSON → Postgres 迁移（需要 DATABASE_URL）
```

CI 流水线执行顺序：`lint → typecheck → build`（见 `.github/workflows/deploy.yml`）。

## Architecture

### Routes

| Route | Purpose |
|---|---|
| `/` | 今日高分选题首页，按账号类型加权排序 |
| `/topics` | 选题库列表，筛选 + 无限滚动 |
| `/topics/[id]` | 完整选题卡详情 |
| `/admin` | 受密码保护的手动拉取、日志、评分、日报（入口 `/admin-login`，不对普通用户暴露） |
| `/creation` | 交互式创作流程（选题→角度→标题→大纲） |
| `/review` | 复盘 |
| `/tools` | 工具调用（文章生成、草稿上传等） |
| `/api/aihot/[...]` | AIHOT REST API 代理 |
| `/api/jobs/fetch-aihot` | 定时拉取触发（需 `x-job-secret` header） |

### Key Modules

- `src/types/` — 四个领域类型文件：`topic-radar.ts`（选题雷达）、`content.ts`（内容管理）、`workflow.ts`（创作流程）、`tool.ts`（工具调用）
- `src/lib/topic-radar/` — 选题雷达核心：AIHOT 拉取适配器、HKR 评分算法、选题卡生成、日报生成、存储读写
- `src/lib/storage/` — 双模式存储层（见下方）
- `src/lib/aihot.ts` — AIHOT API 客户端（带内存缓存和请求间隔限制）
- `scripts/aihot-scheduler.mjs` — PM2 托管的 AIHOT 定时调度器，默认北京时间 09:00 / 18:00 调用受保护任务接口
- `src/lib/auth/admin-session.ts` — 管理员会话（零依赖，基于 `ADMIN_PASSWORD` + httpOnly cookie；`src/middleware.ts` 在边缘层保护 `/admin`）。**注意**：本模块被 middleware 导入，运行在 Edge Runtime，**不能用 `node:crypto`**（Next.js 16 + Turbopack 下会报 `Native module not found`）。哈希用 Web Crypto API（`crypto.subtle.digest`），相关函数为 async；middleware 调用时需 `await`。

### Storage: Dual Mode

`src/lib/storage/json-document-store.ts` 实现了透明的双模式存储：

- **无 `DATABASE_URL`**：读写 `src/data/` 下的本地 JSON 文件
- **有 `DATABASE_URL`**：读写 Postgres `app_json_documents` 表（key=jsonb）

两个数据文档：
- `topic_radar` → `src/data/topic-radar.json`（选题雷达全部数据）
- `workbench` → `src/data/workbench.json`（创作流程数据）

不要绕过 `json-document-store` 直接操作 JSON 文件。

### Topic Radar Data Flow

`SourceItem`(AIHOT 热点) → `HKRScore`(评分) → `TopicCard`(选题卡) → `TopicRadarItem`(聚合视图)

`TopicRadarItem` 是 UI 层使用的聚合类型，包含 `source` + `score` + `card` 三个字段。

### LLM Fallback

配置了 `OPENAI_API_KEY` 时选题卡用 LLM 生成；未配置时用本地启发式生成器（`card-generator.ts`）。两种方式都保留原文链接。

## Conventions

- 时间戳全部用 ISO 8601 字符串
- UI 文案、类型标签、枚举值使用中文（如 `"强烈推荐"`、`"AI科普号"`）
- Path alias：`@/*` → `./src/*`
- CSS 变量体系：`--ink`、`--panel`、`--green`、`--gold`、`--muted`、`--line`、`--foreground`（定义在 `globals.css`）
- 没有测试框架——当前没有 test script
- `generated/` 目录是构建产物，不要手动编辑

## Deployment

- `output: "standalone"` 模式，构建后通过 PM2（`ecosystem.config.cjs`）部署到阿里云 ECS
- PM2 同时管理 Web 进程和单实例 `creator-workbench-scheduler` 调度进程
- CI：push to main → GitHub Actions → SSH 部署到 `/opt/creator-workbench`
- 域名：`workbench.huangjiarong.top`
- Node 22

## Content Production Rule

选题卡生成不能全自动化。必须遵循确认流程：

```
选题确认 → 角度确认 → 标题候选确认 → 大纲确认 → 工具调用确认 → 内容生成
```

`/creation` 页面实现了这个逐步确认的交互流程。

## Env Variables

见 `.env.example`。关键变量：

- `DATABASE_URL` — 为空则用本地 JSON，有值则用 Postgres
- `OPENAI_API_KEY` — 可选，启用 LLM 选题卡生成
- `TOPIC_RADAR_JOB_SECRET` — 保护 `/api/jobs/fetch-aihot` 端点，也是生产调度器的必需配置
- `AIHOT_SCHEDULE_TIMES` / `AIHOT_SCHEDULE_TIME_ZONE` — 可选覆盖定时时刻与时区，默认 `09:00,18:00` / `Asia/Shanghai`
- `AIHOT_BASE_URL` — AIHOT API 地址，有默认值
- `ADMIN_PASSWORD` — 为空则后台锁定（登录始终失败）；公开部署前必须设置
- `ADMIN_COOKIE_SECRET` — 可选，混入管理员会话 cookie 的哈希盐，更换它会让所有已登录会话失效
