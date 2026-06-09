"use client";

import { useState } from "react";
import { Gauge, X } from "lucide-react";
import { accountWeights, hkrFormulaNotes, scoreForAccount } from "@/lib/topic-radar/hkr";
import type { AccountType, HKRScore } from "@/types/topic-radar";

interface HkrScoreDialogProps {
  score: HKRScore;
  account: AccountType;
  compact?: boolean;
}

export function HkrScoreDialog({ score, account, compact = false }: HkrScoreDialogProps) {
  const [open, setOpen] = useState(false);
  const accountScore = scoreForAccount(score, account);
  const weights = accountWeights[account];

  return (
    <>
      <button
        aria-label={`查看 HKR 评分细节，当前分数 ${accountScore}`}
        className={`inline-flex items-center gap-1 rounded-md text-[var(--blue)] transition hover:bg-[#eaf0f4] ${
          compact ? "px-1 py-0.5 text-sm font-semibold" : "px-2 py-1 text-sm font-semibold"
        }`}
        onClick={() => setOpen(true)}
        type="button"
      >
        <Gauge size={15} />
        HKR {accountScore}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-4 py-6" role="dialog" aria-modal="true">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-md border border-[var(--line)] bg-[var(--panel)] shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-[var(--green)]">HKR 评分细节</p>
                <h3 className="mt-1 text-xl font-semibold">当前账号：{account}</h3>
              </div>
              <button
                aria-label="关闭 HKR 评分细节"
                className="grid size-9 place-items-center rounded-md border border-[var(--line)] text-[var(--muted)] hover:text-[var(--foreground)]"
                onClick={() => setOpen(false)}
                type="button"
              >
                <X size={17} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="rounded-md bg-[#fbf8ec] p-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-sm text-[var(--muted)]">账号加权展示分</p>
                    <p className="mt-1 text-3xl font-semibold text-[var(--blue)]">{accountScore}</p>
                  </div>
                  <div className="text-sm text-[var(--muted)]">
                    权重：H {percent(weights.h)} / K {percent(weights.k)} / R {percent(weights.r)}
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  原始总分 {score.total}，推荐级别「{score.level}」。账号加权分用于排序，推荐级别会结合原始总分和最近 72 小时内容池做每日精选校准。
                </p>
              </div>

              <ScoreRow label="H 热点势能" value={score.h} reason={score.reasons.h} formula={hkrFormulaNotes.h} />
              <ScoreRow label="K 知识增量" value={score.k} reason={score.reasons.k} formula={hkrFormulaNotes.k} />
              <ScoreRow label="R 阅读传播潜力" value={score.r} reason={score.reasons.r} formula={hkrFormulaNotes.r} />

              <div className="rounded-md border border-[var(--line)] p-4 text-sm leading-6">
                <p className="font-semibold">总分计算</p>
                <p className="mt-1 text-[var(--muted)]">{hkrFormulaNotes.total}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ScoreRow({
  label,
  value,
  reason,
  formula,
}: {
  label: string;
  value: number;
  reason: string;
  formula: string;
}) {
  return (
    <div className="rounded-md border border-[var(--line)] p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="font-semibold">{label}</p>
        <span className="text-xl font-semibold text-[var(--blue)]">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#e6e1d1]">
        <div className="h-full rounded-full bg-[var(--green)]" style={{ width: `${value}%` }} />
      </div>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{reason}</p>
      <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{formula}</p>
    </div>
  );
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}
