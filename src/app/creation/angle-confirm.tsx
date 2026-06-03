"use client";

import { useTransition, useState } from "react";
import { CheckCircle2, Loader2, PenLine } from "lucide-react";
import { confirmAngle } from "./actions";
import type { ContentAngle } from "@/types/content";

const ALL_ANGLES: ContentAngle[] = ["观点", "案例", "工具评测", "方法论", "项目复盘", "个人实验", "趋势观察"];

interface AngleConfirmProps {
  suggestedAngle: string;
}

export function AngleConfirm({ suggestedAngle }: AngleConfirmProps) {
  const [selected, setSelected] = useState(suggestedAngle);
  const [custom, setCustom] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(() => {
      confirmAngle(selected, showCustom ? custom : undefined);
    });
  };

  return (
    <div className="mt-3 space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {ALL_ANGLES.map((angle) => (
          <button
            className={`rounded-md border px-3 py-2 text-left text-sm transition ${
              selected === angle && !showCustom
                ? "border-[var(--green)] bg-[#edf4ee] font-semibold text-[var(--green)]"
                : "border-[var(--line)] bg-white text-[var(--muted)] hover:border-[var(--green)]"
            }`}
            key={angle}
            onClick={() => {
              setSelected(angle);
              setShowCustom(false);
            }}
            type="button"
          >
            {angle}
            {angle === suggestedAngle ? (
              <span className="ml-1 text-xs opacity-60">推荐</span>
            ) : null}
          </button>
        ))}
      </div>

      <div>
        <button
          className={`inline-flex items-center gap-1.5 text-sm ${showCustom ? "font-semibold text-[var(--green)]" : "text-[var(--muted)]"}`}
          onClick={() => setShowCustom(!showCustom)}
          type="button"
        >
          <PenLine size={14} />
          自定义角度
        </button>
        {showCustom ? (
          <input
            className="mt-2 h-10 w-full rounded-md border border-[var(--line)] bg-white px-3 text-sm outline-none focus:border-[var(--green)]"
            onChange={(e) => setCustom(e.target.value)}
            placeholder="输入自定义角度，例如：行业对比"
            type="text"
            value={custom}
          />
        ) : null}
      </div>

      <button
        className="inline-flex h-9 items-center gap-2 rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white disabled:opacity-50"
        disabled={isPending || (showCustom && !custom.trim())}
        onClick={handleConfirm}
        type="button"
      >
        {isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
        确认角度
      </button>
    </div>
  );
}
