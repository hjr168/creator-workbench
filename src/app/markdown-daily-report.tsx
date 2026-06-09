"use client";

import { BarChart3, Check, Copy, ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";

type ReportBlock =
  | { type: "heading"; level: 1 | 2; text: string }
  | { type: "paragraph"; text: string }
  | { type: "quote"; text: string }
  | { type: "topic"; index: string; title: string; score?: string; details: TopicDetail[] };

type TopicDetail = {
  label: string;
  value: string;
  href?: string;
};

export function MarkdownDailyReport({ markdown }: { markdown: string }) {
  const [copied, setCopied] = useState(false);
  const blocks = useMemo(() => parseDailyReport(markdown), [markdown]);

  async function copyMarkdown() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(markdown);
      } else {
        copyWithFallback(markdown);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      copyWithFallback(markdown);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  }

  return (
    <section className="rounded-md border border-[var(--line)] bg-[var(--panel)] p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="text-[var(--blue)]" size={20} />
          <h2 className="text-lg font-semibold">今日 Markdown 日报</h2>
        </div>
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--ink)] px-3 text-sm font-semibold text-white transition hover:opacity-90"
          onClick={copyMarkdown}
          type="button"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "已复制" : "一键复制"}
        </button>
      </div>

      <div className="space-y-4">
        {blocks.map((block, index) => {
          if (block.type === "heading" && block.level === 1) {
            return (
              <div className="rounded-md border border-[var(--line)] bg-[#fbf8ec] p-4" key={`${block.type}-${index}`}>
                <h3 className="text-2xl font-semibold leading-tight">{renderInline(block.text)}</h3>
              </div>
            );
          }

          if (block.type === "heading") {
            return (
              <h3 className="border-b border-[var(--line)] pb-2 text-lg font-semibold text-[var(--green)]" key={`${block.type}-${index}`}>
                {renderInline(block.text)}
              </h3>
            );
          }

          if (block.type === "paragraph") {
            return (
              <p className="rounded-md bg-[#fbf8ec] p-3 text-sm leading-7 text-[var(--foreground)]" key={`${block.type}-${index}`}>
                {renderInline(block.text)}
              </p>
            );
          }

          if (block.type === "quote") {
            return (
              <blockquote
                className="rounded-md border-l-4 border-[var(--gold)] bg-[#fbf8ec] p-4 text-sm leading-7 text-[var(--muted)]"
                key={`${block.type}-${index}`}
              >
                {renderInline(block.text)}
              </blockquote>
            );
          }

          return <TopicReportCard block={block} key={`${block.type}-${index}`} />;
        })}
      </div>
    </section>
  );
}

function TopicReportCard({ block }: { block: Extract<ReportBlock, { type: "topic" }> }) {
  const source = block.details.find((item) => item.label === "来源");
  const publishedAt = block.details.find((item) => item.label === "发布时间");
  const approach = block.details.find((item) => item.label === "推荐写法");
  const original = block.details.find((item) => item.label === "原文");

  return (
    <article className="rounded-md border border-[var(--line)] bg-[#fbf8ec] p-4">
      <div className="mb-3 flex items-start gap-3">
        <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[var(--ink)] text-sm font-semibold text-white">{block.index}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <h4 className="text-base font-semibold leading-6">{renderInline(block.title)}</h4>
            {block.score ? (
              <span className="w-fit shrink-0 rounded-md bg-white px-2 py-1 text-xs font-semibold text-[var(--green)]">HKR {block.score}</span>
            ) : null}
          </div>
          <div className="mt-3 grid gap-2 text-sm leading-6 text-[var(--muted)] md:grid-cols-2">
            {source ? <Detail label="来源" value={source.value} /> : null}
            {publishedAt ? <Detail label="发布时间" value={formatDateTime(publishedAt.value)} /> : null}
            {approach ? <Detail label="推荐写法" value={approach.value} wide /> : null}
          </div>
          {original?.href ? (
            <a
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--green)]"
              href={original.href}
              rel="noreferrer"
              target="_blank"
            >
              打开原文
              <ExternalLink size={14} />
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function Detail({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "md:col-span-2" : undefined}>
      <span className="font-semibold text-[var(--foreground)]">{label}：</span>
      <span>{value}</span>
    </div>
  );
}

function parseDailyReport(markdown: string): ReportBlock[] {
  const lines = markdown.split(/\r?\n/);
  const blocks: ReportBlock[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith("# ")) {
      blocks.push({ type: "heading", level: 1, text: line.replace(/^#\s+/, "") });
      continue;
    }

    if (line.startsWith("## ")) {
      blocks.push({ type: "heading", level: 2, text: line.replace(/^##\s+/, "") });
      continue;
    }

    if (line.startsWith(">")) {
      blocks.push({ type: "quote", text: line.replace(/^>\s?/, "") });
      continue;
    }

    const topicMatch = line.match(/^(\d+)\.\s+(.*?)(?:（HKR\s+(\d+)）)?$/);
    if (topicMatch) {
      const details: TopicDetail[] = [];
      while (index + 1 < lines.length && /^\s+-\s+/.test(lines[index + 1])) {
        index += 1;
        details.push(...parseDetail(lines[index]));
      }

      blocks.push({
        type: "topic",
        index: topicMatch[1],
        title: stripBold(topicMatch[2]),
        score: topicMatch[3],
        details,
      });
      continue;
    }

    blocks.push({ type: "paragraph", text: line });
  }

  return blocks;
}

function parseDetail(line: string): TopicDetail[] {
  const clean = line.replace(/^\s+-\s+/, "");
  const [label, ...rest] = clean.split("：");
  const value = rest.join("：").trim();
  if (!label || !value) return [];

  if (label === "来源") {
    const [source, publishedAt] = value.split("｜发布时间：");
    return [
      { label, value: source.trim() },
      ...(publishedAt ? [{ label: "发布时间", value: publishedAt.trim() }] : []),
    ];
  }

  if (label === "原文") {
    return [{ label, value, href: value }];
  }

  return [{ label, value }];
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|https?:\/\/\S+)/g).filter(Boolean);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }

    if (/^https?:\/\//.test(part)) {
      return (
        <a className="font-semibold text-[var(--green)]" href={part} key={`${part}-${index}`} rel="noreferrer" target="_blank">
          {part}
        </a>
      );
    }

    return part;
  });
}

function stripBold(text: string) {
  return text.replace(/\*\*/g, "");
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function copyWithFallback(value: string) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}
