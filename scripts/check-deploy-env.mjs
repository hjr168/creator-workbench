#!/usr/bin/env node
/**
 * 部署前环境变量检查。
 *
 * 用法：
 *   NODE_ENV=production npm run check:deploy   # 生产模式：缺必需项则退出码 1
 *   npm run check:deploy                        # 本地模式：缺必需项只输出 warning
 *
 * 设计目标：在公开部署前，快速确认生产环境必需的环境变量是否就位。
 */
const isProduction = process.env.NODE_ENV === "production";

const REQUIRED = [
  { key: "DATABASE_URL", hint: "后台写操作依赖它；生产环境未配置时写操作会被拒绝" },
  { key: "TOPIC_RADAR_JOB_SECRET", hint: "保护 /api/jobs/fetch-aihot；未配置时接口返回 500" },
  { key: "ADMIN_PASSWORD", hint: "保护 /admin；未配置则后台锁定、登录始终失败" },
  { key: "ADMIN_COOKIE_SECRET", hint: "管理员会话 cookie 哈希盐" },
];

const OPTIONAL = [
  { key: "OPENAI_API_KEY", hint: "未配置时使用本地启发式生成器兜底" },
  { key: "TOPIC_RADAR_LLM_MODEL", hint: "默认 gpt-4o-mini" },
  { key: "MINIAPP_API_TOKEN", hint: "保护 /api/miniapp/* 只读接口；为空则公开可读" },
  { key: "AIHOT_BASE_URL", hint: "AIHOT API 地址，有默认值" },
  { key: "AIHOT_TIMEOUT_MS", hint: "AIHOT 请求超时" },
  { key: "AIHOT_MIN_INTERVAL_MS", hint: "AIHOT 请求最小间隔" },
  { key: "AIHOT_SCHEDULE_TIMES", hint: "默认 09:00,18:00" },
  { key: "AIHOT_SCHEDULE_TIME_ZONE", hint: "默认 Asia/Shanghai" },
  { key: "AIHOT_JOB_URL", hint: "默认调用本机 127.0.0.1:3000" },
  { key: "AIHOT_JOB_TIMEOUT_MS", hint: "默认 600000ms" },
  { key: "AIHOT_SCHEDULE_LIMIT", hint: "默认每次抓取 30 条" },
];

const lines = [];
let hasError = false;

function configured(key) {
  const value = process.env[key];
  return typeof value === "string" && value.trim().length > 0;
}

lines.push(`部署环境变量检查（NODE_ENV=${process.env.NODE_ENV ?? "(unset)"}）`);
lines.push("".padEnd(48, "-"));

for (const item of REQUIRED) {
  if (configured(item.key)) {
    lines.push(`[OK]   ${item.key} configured`);
  } else if (isProduction) {
    hasError = true;
    lines.push(`[ERROR] ${item.key} is missing — ${item.hint}`);
  } else {
    lines.push(`[WARN]  ${item.key} not configured — ${item.hint}`);
  }
}

lines.push("".padEnd(48, "-"));
for (const item of OPTIONAL) {
  if (configured(item.key)) {
    lines.push(`[OK]   ${item.key} configured`);
  } else {
    lines.push(`[INFO] ${item.key} not configured — ${item.hint}`);
  }
}

lines.push("".padEnd(48, "-"));
if (hasError) {
  lines.push("结果：生产环境缺少必需变量，已阻止部署。请补齐后重试。");
} else if (isProduction) {
  lines.push("结果：生产环境必需变量已就位，可以继续部署。");
} else {
  lines.push("结果：本地开发检查完成（必需变量缺失仅作提示，不阻塞）。");
}

console.log(lines.join("\n"));

if (hasError) {
  process.exit(1);
}
