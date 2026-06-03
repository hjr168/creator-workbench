"use client";

import { useTransition, useState } from "react";
import { CheckCircle2, Loader2, PenLine } from "lucide-react";
import { confirmTitle } from "./actions";

interface TitleConfirmProps {
  options: string[];
}

export function TitleConfirm({ options }: TitleConfirmProps) {
  const [selected, setSelected] = useState(options[0] ?? "");
  const [custom, setCustom] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(() => {
      confirmTitle(selected, showCustom ? custom : undefined);
    });
  };

  return (
    <div className="mt-3 space-y-3">
      {options.length > 0 ? (
        <div className="space-y-2">
          {options.map((title, index) => (
            <button
              className={`w-full rounded-md border px-4 py-3 text-left text-sm transition ${
                selected === title && !showCustom
                  ? "border-[var(--green)] bg-[#edf4ee] font-semibold"
                  : "border-[var(--line)] bg-white text-[var(--muted)] hover:border-[var(--green)]"
              }`}
              key={title}
              onClick={() => {
                setSelected(title);
                setShowCustom(false);
              }}
              type="button"
            >
              <span className="mr-2 text-xs text-[var(--muted)]">候选 {index + 1}</span>
              {title}
            </button>
          ))}
        </div>
      ) : null}

      <div>
        <button
          className={`inline-flex items-center gap-1.5 text-sm ${showCustom ? "font-semibold text-[var(--green)]" : "text-[var(--muted)]"}`}
          onClick={() => setShowCustom(!showCustom)}
          type="button"
        >
          <PenLine size={14} />
          自定义标题
        </button>
        {showCustom ? (
          <input
            className="mt-2 h-10 w-full rounded-md border border-[var(--line)] bg-white px-3 text-sm outline-none focus:border-[var(--green)]"
            onChange={(e) => setCustom(e.target.value)}
            placeholder="输入自定义标题"
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
        确认标题
      </button>
    </div>
  );
}
