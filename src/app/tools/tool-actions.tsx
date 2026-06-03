"use client";

import { Clipboard, ExternalLink, Play } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { runPreparedGeneration } from "@/app/creation/actions";

interface ToolActionsProps {
  canRunGeneration: boolean;
  command?: string;
  status: string;
  toolRunId: string;
}

export function ToolActions({ canRunGeneration, command, toolRunId }: ToolActionsProps) {
  const [copied, setCopied] = useState(false);

  async function copyCommand() {
    if (!command) {
      return;
    }

    await navigator.clipboard.writeText(command);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--line)] bg-[#fbf8ec] px-3 text-sm font-semibold"
        onClick={copyCommand}
        type="button"
      >
        <Clipboard size={16} />
        {copied ? "已复制" : "复制命令"}
      </button>

      {canRunGeneration ? (
        <form action={runPreparedGeneration.bind(null, toolRunId)}>
          <button className="inline-flex h-9 items-center gap-2 rounded-md bg-[var(--green)] px-3 text-sm font-semibold text-white">
            <Play size={16} />
            执行生成
          </button>
        </form>
      ) : null}

      <Link
        className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--line)] bg-transparent px-3 text-sm font-semibold"
        href="/review"
      >
        <ExternalLink size={16} />
        去复盘
      </Link>
    </div>
  );
}
