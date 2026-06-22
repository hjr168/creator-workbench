/**
 * 时间格式化。
 *
 * 后端返回的 ISO 8601 字符串统一视为 UTC（如 `2026-06-15T08:00:00.000Z`）。
 * 这里用 UTC 分量格式化，保证不同时区的设备看到一致的时间，
 * 避免本地时区导致发布时间错乱。
 */
export function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");
  const minute = String(date.getUTCMinutes()).padStart(2, "0");
  return `${month}-${day} ${hour}:${minute}`;
}

/** 兼容旧调用：截取 markdown 前 N 个非空行。 */
export function compactMarkdown(markdown: string, maxLines = 18) {
  return markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, maxLines);
}

/** Markdown 行类型，用于轻量渲染。 */
export type MarkdownLineType = "h1" | "h2" | "h3" | "list" | "paragraph";

export interface ParsedMarkdownLine {
  type: MarkdownLineType;
  text: string;
}

/**
 * 把 markdown 文本解析成行类型数组，供小程序端轻量渲染：
 * - `# ` / `## ` / `### ` → 标题
 * - `- ` / `* ` / `数字.` → 列表项（去掉前缀符号）
 * - 其余 → 段落
 * 同时把 `**粗体**` 转成纯文本（小程序 Text 无法嵌套粗体，保留文字即可）。
 */
export function parseMarkdown(markdown: string, maxLines = 60): ParsedMarkdownLine[] {
  return markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, maxLines)
    .map((line) => classifyLine(line));
}

function classifyLine(line: string): ParsedMarkdownLine {
  const stripped = line.replace(/\*\*(.+?)\*\*/g, "$1");

  let m = stripped.match(/^(#{1,3})\s+(.*)$/);
  if (m) {
    const level = m[1].length;
    return { type: level === 1 ? "h1" : level === 2 ? "h2" : "h3", text: m[2] };
  }

  m = stripped.match(/^[-*+]\s+(.*)$/);
  if (m) return { type: "list", text: m[1] };

  m = stripped.match(/^\d+[.)]\s+(.*)$/);
  if (m) return { type: "list", text: m[1] };

  return { type: "paragraph", text: stripped };
}
