"use client";

import { useState } from "react";
import { AlertTriangle, ThumbsDown, ThumbsUp } from "lucide-react";
import type { TopicFeedbackType } from "@/types/feedback";

type Status = "idle" | "submitting" | "done" | "error";

const OPTIONS: { type: TopicFeedbackType; label: string; icon: typeof ThumbsUp }[] = [
  { type: "useful", label: "这个选题有用", icon: ThumbsUp },
  { type: "not_useful", label: "不太有用", icon: ThumbsDown },
  { type: "fact_issue", label: "事实可能有误", icon: AlertTriangle },
];

/**
 * 详情页反馈按钮组。无需登录，点击调用 POST /api/feedback/topic。
 * 提交一次后整组禁用并提示「感谢反馈」。
 */
export function TopicFeedbackActions({ topicCardId }: { topicCardId: string }) {
  const [status, setStatus] = useState<Status>("idle");

  async function submit(type: TopicFeedbackType) {
    if (status === "submitting" || status === "done") return;
    setStatus("submitting");
    try {
      const response = await fetch("/api/feedback/topic", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topicCardId, type }),
      });
      if (!response.ok) throw new Error("request failed");
      setStatus("done");
    } catch {
      setStatus("error");
      window.setTimeout(() => setStatus("idle"), 2000);
    }
  }

  if (status === "done") {
    return <p className="rounded-md bg-[#edf4ee] px-3 py-2 text-sm font-semibold text-[var(--green)]">感谢反馈</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="self-center text-sm font-semibold text-[var(--muted)]">这条选题对你有帮助吗？</span>
      {OPTIONS.map((option) => (
        <button
          className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-md border px-3 text-sm transition ${
            status === "error"
              ? "border-[var(--red)] text-[var(--red)]"
              : "border-[var(--line)] text-[var(--muted)] hover:bg-[var(--panel-strong)] hover:text-[var(--foreground)]"
          } disabled:opacity-60`}
          disabled={status === "submitting"}
          key={option.type}
          onClick={() => submit(option.type)}
          type="button"
        >
          <option.icon size={15} />
          {option.label}
        </button>
      ))}
      {status === "submitting" ? <span className="self-center text-xs text-[var(--muted)]">提交中…</span> : null}
      {status === "error" ? (
        <span className="self-center text-xs text-[var(--red)]">反馈失败，请稍后再试</span>
      ) : null}
    </div>
  );
}
