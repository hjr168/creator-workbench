"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import { HkrScoreDialog } from "@/app/hkr-score-dialog";
import type { AccountType, TopicRadarItem } from "@/types/topic-radar";

const PAGE_SIZE = 8;

export function TopicCardList({
  items,
  account,
}: {
  items: TopicRadarItem[];
  account: AccountType;
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);
  const hasMore = visibleCount < items.length;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((count) => Math.min(count + PAGE_SIZE, items.length));
        }
      },
      { rootMargin: "520px 0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, items.length, visibleCount]);

  if (!items.length) {
    return (
      <div className="rounded-md border border-dashed border-[var(--line)] bg-[var(--panel)] p-8 text-center text-sm text-[var(--muted)]">
        暂无符合条件的选题。
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between text-sm text-[var(--muted)]">
        <span>共 {items.length} 条选题</span>
        <span>已显示 {visibleItems.length} 条</span>
      </div>

      <div className="space-y-4">
        {visibleItems.map((item) => (
          <TopicLongCard account={account} item={item} key={item.card.id} />
        ))}
      </div>

      <div ref={sentinelRef} className="flex min-h-14 items-center justify-center text-sm text-[var(--muted)]">
        {hasMore ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="animate-spin" size={16} />
            继续滚动加载更多
          </span>
        ) : (
          <span>已经到底了</span>
        )}
      </div>
    </section>
  );
}

function TopicLongCard({ item, account }: { item: TopicRadarItem; account: AccountType }) {
  const category = item.source.category ?? "AI";
  const tags = [category, item.card.recommendedApproach, ...item.card.suitableAccounts.slice(0, 2)];

  return (
    <article className="rounded-md border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm">
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
          <span className="grid size-6 place-items-center rounded-full bg-[#edf4ee] text-[var(--green)]">
            {item.source.sourceName.slice(0, 1).toUpperCase()}
          </span>
          <span className="font-semibold text-[var(--foreground)]">{item.source.sourceName}</span>
          <span>@{item.source.provider}</span>
          <span>{formatDate(item.source.publishedAt)}</span>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold leading-7">{item.card.title}</h2>
            <p className="mt-2 max-w-5xl text-sm leading-6 text-[var(--muted)]">{item.card.oneLineSummary}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 xl:justify-end">
            <span className="rounded-md bg-[#fff6e7] px-2 py-1 text-xs font-semibold text-[var(--gold)]">{item.score.level}</span>
            <HkrScoreDialog account={account} compact score={item.score} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span className="rounded-md bg-[#eef1f1] px-2.5 py-1 text-xs text-[var(--muted)]" key={tag}>
              {tag}
            </span>
          ))}
          <span className="rounded-md bg-[#eef1f1] px-2.5 py-1 text-xs text-[var(--muted)]">
            H{item.score.h} / K{item.score.k} / R{item.score.r}
          </span>
        </div>
      </div>

      <div className="mt-4 border-t border-[var(--line)] pt-3">
        <div className="rounded-md bg-[#edf6f1] px-3 py-2 text-sm leading-6 text-[var(--green)]">
          <span className="font-semibold">推荐理由：</span>
          {item.card.whyWorthWriting}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <a className="inline-flex items-center gap-1 text-sm text-[var(--green)] hover:underline" href={item.source.url} rel="noreferrer" target="_blank">
          查看原文 <ExternalLink size={14} />
        </a>
        <Link className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[var(--ink)] px-3 text-sm font-semibold text-white" href={`/topics/${item.card.id}`}>
          详情
          <ArrowRight size={15} />
        </Link>
      </div>
    </article>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
