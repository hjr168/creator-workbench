"use client";

import { useTransition } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import { switchTitle } from "./actions";
import type { TitleCandidate } from "@/types/content";

interface TitleCandidatesPanelProps {
  candidates: TitleCandidate[];
}

export function TitleCandidatesPanel({ candidates }: TitleCandidatesPanelProps) {
  return (
    <div className="rounded-md border border-[var(--line)] bg-[var(--panel)] p-5">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="text-[var(--gold)]" size={20} />
        <h2 className="text-lg font-semibold">标题候选</h2>
      </div>
      <div className="space-y-3">
        {candidates.map((candidate) => (
          <TitleCard candidate={candidate} key={candidate.id} />
        ))}
      </div>
    </div>
  );
}

function TitleCard({ candidate }: { candidate: TitleCandidate }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      className={`w-full rounded-md border p-3 text-left transition ${
        candidate.isSelected
          ? "border-[var(--green)] bg-[#edf4ee]"
          : "border-[var(--line)] bg-[#fbf8ec] hover:border-[var(--green)]"
      }`}
      disabled={candidate.isSelected || isPending}
      onClick={() => {
        startTransition(() => {
          switchTitle(candidate.id);
        });
      }}
      type="button"
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold leading-5">{candidate.title}</p>
        {candidate.isSelected ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-white px-2 py-1 text-xs text-[var(--green)]">
            <Check size={12} />
            已选
          </span>
        ) : isPending ? (
          <span className="shrink-0">
            <Loader2 size={14} className="animate-spin text-[var(--muted)]" />
          </span>
        ) : null}
      </div>
      <p className="text-xs text-[var(--muted)]">
        {candidate.platform} · {candidate.strategy}
      </p>
      {candidate.reason ? <p className="mt-2 text-sm text-[var(--muted)]">{candidate.reason}</p> : null}
    </button>
  );
}
