"use client";

import { useTransition } from "react";
import { CheckCircle2, Loader2, PenLine } from "lucide-react";
import { reeditDecision, confirmCurrentStep } from "./actions";
import { AngleConfirm } from "./angle-confirm";
import { TitleConfirm } from "./title-confirm";
import type { CreationDecision } from "@/types/workflow";

interface DecisionCardProps {
  decision: CreationDecision;
  index: number;
}

const REEDITABLE_STEPS = new Set(["选题确认", "角度确认", "标题确认", "大纲确认"]);

export function DecisionCard({ decision, index }: DecisionCardProps) {
  const [isPending, startTransition] = useTransition();

  const isAnglePending = decision.status === "待确认" && decision.step === "角度确认";
  const isTitlePending = decision.status === "待确认" && decision.step === "标题确认";
  const isGenericPending = decision.status === "待确认" && !isAnglePending && !isTitlePending;
  const canReedit = decision.status === "已确认" && REEDITABLE_STEPS.has(decision.step);

  return (
    <div className="grid gap-3 md:grid-cols-[44px_1fr]">
      <div className="grid size-10 place-items-center rounded-md bg-[var(--panel-strong)] text-sm font-semibold">
        {index + 1}
      </div>
      <div className="rounded-md border border-[var(--line)] bg-[#fbf8ec] p-4">
        <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold">{decision.step}</p>
          <span className={`w-fit rounded-md px-2.5 py-1 text-xs font-semibold ${statusClass(decision.status)}`}>
            {decision.status}
          </span>
        </div>
        <p className="text-sm text-[var(--muted)]">{decision.question}</p>
        {decision.answer ? <p className="mt-2 text-sm leading-6">{decision.answer}</p> : null}

        {isAnglePending && <AngleConfirm suggestedAngle={decision.confirmedValue ?? "观点"} />}
        {isTitlePending && <TitleConfirm options={decision.options ?? []} />}

        {isGenericPending && (
          <form action={confirmCurrentStep} className="mt-4">
            <button className="inline-flex h-9 items-center gap-2 rounded-md bg-[var(--ink)] px-3 text-sm font-semibold text-white">
              <CheckCircle2 size={16} />
              确认
            </button>
          </form>
        )}

        {canReedit && (
          <button
            className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-md border border-[var(--line)] bg-white px-3 text-xs font-semibold text-[var(--muted)] transition hover:border-[var(--green)] hover:text-[var(--green)] disabled:opacity-50"
            disabled={isPending}
            onClick={() => {
              startTransition(() => {
                reeditDecision(decision.id);
              });
            }}
            type="button"
          >
            {isPending ? <Loader2 size={13} className="animate-spin" /> : <PenLine size={13} />}
            重新编辑
          </button>
        )}
      </div>
    </div>
  );
}

function statusClass(status: string) {
  switch (status) {
    case "已确认":
      return "bg-[#e5f0e7] text-[var(--green)]";
    case "待确认":
      return "bg-[#f4ead0] text-[var(--gold)]";
    case "需修改":
      return "bg-[#f3ddd9] text-[var(--red)]";
    default:
      return "bg-white text-[var(--muted)]";
  }
}
