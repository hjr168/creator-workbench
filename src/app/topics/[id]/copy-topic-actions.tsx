"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { TopicRadarItem } from "@/types/topic-radar";

type CopyTarget = "title" | "outline" | "card";

/**
 * 详情页复制操作：复制标题 / 复制文章大纲 / 复制完整选题卡。
 * 客户端组件，接收可序列化的选题数据。
 */
export function CopyTopicActions({ item }: { item: TopicRadarItem }) {
  const [copied, setCopied] = useState<CopyTarget | "error" | null>(null);

  async function copy(target: CopyTarget) {
    const text = buildText(target, item);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(target);
    } catch {
      setCopied("error");
    }
    window.setTimeout(() => setCopied(null), 1800);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <CopyButton copied={copied === "title"} label="复制标题" onClick={() => copy("title")} />
      <CopyButton copied={copied === "outline"} label="复制文章大纲" onClick={() => copy("outline")} />
      <CopyButton copied={copied === "card"} label="复制完整选题卡" onClick={() => copy("card")} />
      {copied === "error" ? <span className="self-center text-xs text-[var(--red)]">复制失败，请手动复制</span> : null}
    </div>
  );
}

function CopyButton({ copied, label, onClick }: { copied: boolean; label: string; onClick: () => void }) {
  return (
    <button
      className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-semibold transition ${
        copied
          ? "bg-[#edf4ee] text-[var(--green)]"
          : "border border-[var(--line)] text-[var(--muted)] hover:bg-[var(--panel-strong)] hover:text-[var(--foreground)]"
      }`}
      onClick={onClick}
      type="button"
    >
      {copied ? <Check size={15} /> : <Copy size={15} />}
      {copied ? "已复制" : label}
    </button>
  );
}

function buildText(target: CopyTarget, item: TopicRadarItem): string {
  if (target === "title") return item.card.title;
  if (target === "outline") return numbered(item.card.outline);
  return buildFullCardMarkdown(item);
}

function numbered(items: string[]): string {
  return items.map((entry, index) => `${index + 1}. ${entry}`).join("\n");
}

function bulleted(items: string[]): string {
  return items.map((entry) => `- ${entry}`).join("\n");
}

function buildFullCardMarkdown(item: TopicRadarItem): string {
  const { card, score, source } = item;
  return [
    `# 选题：${card.title}`,
    "",
    "## 一句话摘要",
    card.oneLineSummary,
    "",
    "## 为什么值得写",
    card.whyWorthWriting,
    "",
    "## 推荐标题",
    numbered(card.recommendedTitles),
    "",
    "## 推荐角度",
    numbered(card.writingAngles),
    "",
    "## 文章大纲",
    numbered(card.outline),
    "",
    "## HKR 评分",
    `- H 热点势能：${score.h}`,
    `- K 知识增量：${score.k}`,
    `- R 阅读传播潜力：${score.r}`,
    `- 总分：${score.total}`,
    `- 推荐级别：${score.level}`,
    "",
    "## 适合账号与写法",
    `- 适合账号：${card.suitableAccounts.join("、")}`,
    `- 推荐写法：${card.recommendedApproach}`,
    `- 预计难度：${card.difficulty}`,
    "",
    "## 事实核对",
    `- 原文链接：${source.url}`,
    `- 来源：${source.sourceName}`,
    `- 发布时间：${source.publishedAt}`,
    "",
    "## 风险提示",
    bulleted(card.risks),
    "",
  ].join("\n");
}
