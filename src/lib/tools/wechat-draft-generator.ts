import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { WorkbenchData } from "@/lib/storage/local-json";
import type { Outline, TitleCandidate, Topic } from "@/types/content";
import type { CreationSession, GenerationInput } from "@/types/workflow";
import type { ToolOutput } from "@/types/tool";

interface GeneratedDraftResult {
  command: string;
  inputSummary: string;
  outputs: ToolOutput[];
}

interface GenerationParts {
  topic: Topic;
  title: TitleCandidate;
  outline: Outline;
  platform: NonNullable<CreationSession["targetPlatform"]>;
  contentType: NonNullable<CreationSession["targetContentType"]>;
  angle: NonNullable<CreationSession["confirmedAngle"]>;
}

export async function generateWechatDraftFromSession(
  data: WorkbenchData,
  session: CreationSession,
): Promise<GeneratedDraftResult> {
  const topic = session.topicSnapshot ?? data.topics.find((item) => item.id === session.topicId);
  const title = data.titleCandidates.find(
    (candidate) => candidate.id === session.confirmedTitleId && candidate.isSelected,
  );
  const outline =
    data.outlines.find((item) => item.id === session.confirmedOutlineId) ??
    data.outlines.find((item) => item.topicId === session.topicId && item.isConfirmed);

  const parts = getGenerationParts(session, topic, title, outline);

  const now = new Date().toISOString();
  const slug = `${formatDateForFile(now)}-${session.id}`;
  const outputDir = path.join(process.cwd(), "generated", "wechat-drafts");
  const inputPath = path.join(outputDir, `${slug}-input.json`);
  const markdownPath = path.join(outputDir, `${slug}.md`);
  const htmlPath = path.join(outputDir, `${slug}.html`);

  const generationInput: GenerationInput = {
    sessionId: session.id,
    topicId: parts.topic.id,
    platform: parts.platform,
    contentType: parts.contentType,
    angle: parts.angle,
    title: parts.title.title,
    outline: serializeOutline(parts.outline),
    notes: parts.topic.note,
  };
  const markdown = renderMarkdown(parts.topic, parts.title, parts.outline, session);

  await mkdir(outputDir, { recursive: true });
  await writeFile(inputPath, `${JSON.stringify(generationInput, null, 2)}\n`, "utf-8");
  await writeFile(markdownPath, markdown, "utf-8");
  await writeFile(htmlPath, renderHtml(parts.title.title, markdown), "utf-8");

  return {
    command: `internal:generate-wechat-draft --input ${inputPath}`,
    inputSummary: `公众号长文生成完成：${parts.title.title}`,
    outputs: [
      {
        id: `output-${slug}-input`,
        label: "已确认生成输入",
        kind: "json",
        path: inputPath,
        description: "由当前创作流的已确认选题、标题和大纲整理生成。",
      },
      {
        id: `output-${slug}-markdown`,
        label: "公众号 Markdown 草稿",
        kind: "markdown",
        path: markdownPath,
        description: "可继续人工编辑的真实本地草稿文件。",
      },
      {
        id: `output-${slug}-html`,
        label: "HTML 预览",
        kind: "html",
        path: htmlPath,
        description: "由 Markdown 草稿生成的本地预览文件。",
      },
    ],
  };
}

function getGenerationParts(
  session: CreationSession,
  topic: Topic | undefined,
  title: TitleCandidate | undefined,
  outline: Outline | undefined,
): GenerationParts {
  if (!session.topicId || !topic) {
    throw new Error("缺少已确认选题，无法生成公众号草稿。");
  }

  if (!session.targetPlatform || !session.targetContentType || !session.confirmedAngle) {
    throw new Error("缺少平台、内容类型或角度确认，无法生成公众号草稿。");
  }

  if (!title) {
    throw new Error("缺少已选择标题，无法生成公众号草稿。");
  }

  if (!outline?.isConfirmed) {
    throw new Error("缺少已确认大纲，无法生成公众号草稿。");
  }

  return {
    topic,
    title,
    outline,
    platform: session.targetPlatform,
    contentType: session.targetContentType,
    angle: session.confirmedAngle,
  };
}

function serializeOutline(outline: Outline) {
  return [
    `开头：${outline.opening}`,
    "核心观点：",
    ...outline.corePoints.map((point, index) => `${index + 1}. ${point}`),
    "案例：",
    ...outline.cases.map((item, index) => `${index + 1}. ${item}`),
    `结尾：${outline.ending}`,
    `行动引导：${outline.callToAction}`,
  ].join("\n");
}

function renderMarkdown(
  topic: Topic,
  title: TitleCandidate,
  outline: Outline,
  session: CreationSession,
) {
  const tags = topic.tags.map((tag) => `#${tag}`).join(" ");

  return `# ${title.title}

> 平台：${session.targetPlatform}
> 类型：${session.targetContentType}
> 角度：${session.confirmedAngle}
> 原始选题：${topic.title}

${outline.opening}

## 先说结论

${outline.corePoints[0]}

这件事对个人 IP 内容创作尤其重要：内容不是一次性灵感，而是一套可以重复运行、持续复盘的判断流程。

## 核心观点

${outline.corePoints.map((point, index) => `${index + 1}. ${point}`).join("\n")}

## 可以怎么落地

${outline.cases.map((item, index) => `### 场景 ${index + 1}\n\n${item}`).join("\n\n")}

## 我的判断

当工具进入稳定流程后，它的价值不再是“帮我写一篇”，而是帮助我把选题、判断、表达和复盘连接起来。人依然负责取舍，工具负责把已经确认的结构变成可编辑的草稿。

${outline.ending}

${outline.callToAction}

---

${tags}
`;
}

function renderHtml(title: string, markdown: string) {
  const body = markdown
    .split("\n")
    .map((line) => renderMarkdownLine(line))
    .join("\n");

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      body { margin: 0; background: #f6f1e7; color: #1f2a24; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      main { max-width: 760px; margin: 0 auto; padding: 40px 20px 64px; background: #fffdf7; }
      h1 { font-size: 30px; line-height: 1.25; margin: 0 0 24px; }
      h2 { font-size: 22px; margin: 32px 0 12px; }
      h3 { font-size: 18px; margin: 24px 0 10px; }
      p, li, blockquote { font-size: 16px; line-height: 1.85; }
      blockquote { margin: 0 0 24px; padding: 12px 16px; border-left: 4px solid #2f6f51; background: #edf4ee; color: #506057; }
      hr { border: 0; border-top: 1px solid #e7decb; margin: 32px 0; }
    </style>
  </head>
  <body>
    <main>
${body}
    </main>
  </body>
</html>
`;
}

function renderMarkdownLine(line: string) {
  if (line.startsWith("# ")) {
    return `      <h1>${escapeHtml(line.slice(2))}</h1>`;
  }

  if (line.startsWith("## ")) {
    return `      <h2>${escapeHtml(line.slice(3))}</h2>`;
  }

  if (line.startsWith("### ")) {
    return `      <h3>${escapeHtml(line.slice(4))}</h3>`;
  }

  if (line.startsWith("> ")) {
    return `      <blockquote>${escapeHtml(line.slice(2))}</blockquote>`;
  }

  if (line === "---") {
    return "      <hr />";
  }

  if (!line.trim()) {
    return "";
  }

  return `      <p>${escapeHtml(line)}</p>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDateForFile(iso: string) {
  return iso.replaceAll(":", "-").replaceAll(".", "-");
}
