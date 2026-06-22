"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

/**
 * 一键复制 Markdown 日报。复制成功显示「已复制」，失败显示「复制失败，请手动复制」。
 */
export function CopyDailyReport({ markdown }: { markdown: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  async function copy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(markdown);
      } else {
        copyWithFallback(markdown);
      }
      setStatus("copied");
    } catch {
      setStatus("error");
    }
    window.setTimeout(() => setStatus("idle"), 1800);
  }

  return (
    <button
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold text-white transition disabled:opacity-60 ${
        status === "error" ? "bg-[var(--red)]" : "bg-[var(--ink)]"
      }`}
      onClick={copy}
      type="button"
    >
      {status === "copied" ? <Check size={16} /> : <Copy size={16} />}
      {status === "copied" ? "已复制" : status === "error" ? "复制失败，请手动复制" : "一键复制日报"}
    </button>
  );
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
