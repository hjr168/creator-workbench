"use client";

import { type AIHotItem, getCategoryLabel } from "@/lib/aihot";
import { importFromAIHot } from "./actions";
import { useTransition, useRef, useState, useCallback } from "react";
import {
  Download,
  ExternalLink,
  Loader2,
  Search,
  Sparkles,
  X,
} from "lucide-react";

interface AIHotSearchProps {
  defaultItems: AIHotItem[];
  importedIds: Set<string>;
}

export function AIHotSearch({ defaultItems, importedIds }: AIHotSearchProps) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<AIHotItem[]>(defaultItems);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(defaultItems.length);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setItems(defaultItems);
      setTotal(defaultItems.length);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ q, limit: "20" });
      const res = await fetch(`/api/aihot/search?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `搜索失败 (${res.status})`);
      }
      const data = await res.json();
      setItems(data.items ?? []);
      setTotal(data.count ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "搜索失败");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [defaultItems]);

  const handleInput = (value: string) => {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(value), 400);
  };

  const clearSearch = () => {
    setQuery("");
    setItems(defaultItems);
    setTotal(defaultItems.length);
    setError(null);
  };

  return (
    <section className="mb-5 rounded-md border border-[var(--line)] bg-[var(--panel)]">
      <div className="border-b border-[var(--line)] px-5 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="text-[var(--green)]" size={20} />
          <h2 className="text-lg font-semibold">AIHot 精选选题</h2>
        </div>
        <p className="text-sm text-[var(--muted)]">
          来自 aihot.virxact.com 的精选 AI 动态，搜索关键字或直接浏览，点击导入即可作为选题进入创作流。
        </p>
      </div>

      <div className="border-b border-[var(--line)] px-5 py-3">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            size={16}
          />
          <input
            className="h-10 w-full rounded-md border border-[var(--line)] bg-[#fbf8ec] pl-9 pr-9 text-sm outline-none focus:border-[var(--green)]"
            onChange={(e) => handleInput(e.target.value)}
            placeholder="搜索关键字，例如 OpenAI、Claude、大模型、Agent…"
            type="text"
            value={query}
          />
          {query ? (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)]"
              onClick={clearSearch}
            >
              <X size={16} />
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="p-5 text-sm text-red-600">{error}</div>
      ) : loading ? (
        <div className="flex items-center justify-center gap-2 p-8 text-sm text-[var(--muted)]">
          <Loader2 size={16} className="animate-spin" />
          搜索中…
        </div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center text-sm text-[var(--muted)]">
          {query ? `没有找到与「${query}」相关的结果` : "暂无精选内容"}
        </div>
      ) : (
        <div className="divide-y divide-[var(--line)]">
          {query && (
            <div className="px-5 py-2 text-xs text-[var(--muted)]">
              搜索「{query}」共 {total} 条结果
            </div>
          )}
          {items.map((item) => (
            <AIHotItemRow
              importedIds={importedIds}
              item={item}
              key={item.id}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function AIHotItemRow({
  item,
  importedIds,
}: {
  item: AIHotItem;
  importedIds: Set<string>;
}) {
  const alreadyImported = importedIds.has(item.id);

  return (
    <div className="flex items-start gap-4 px-5 py-4">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="rounded-md bg-[#edf4ee] px-2 py-0.5 text-xs text-[var(--green)]">
            {getCategoryLabel(item.category)}
          </span>
          <span className="text-xs text-[var(--muted)]">{item.source}</span>
        </div>
        <p className="mb-1 text-sm font-semibold">{item.title}</p>
        <p className="line-clamp-2 text-xs text-[var(--muted)]">
          {item.summary}
        </p>
        <a
          className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--green)] hover:underline"
          href={item.url}
          rel="noopener noreferrer"
          target="_blank"
        >
          <ExternalLink size={12} />
          原文
        </a>
      </div>
      <div className="shrink-0 pt-1">
        {alreadyImported ? (
          <span className="inline-flex h-9 items-center rounded-md border border-[var(--line)] px-3 text-xs text-[var(--muted)]">
            已导入
          </span>
        ) : (
          <ImportButton item={item} />
        )}
      </div>
    </div>
  );
}

function ImportButton({ item }: { item: AIHotItem }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[var(--green)] px-3 text-xs font-semibold text-white transition hover:bg-[#275d45] disabled:opacity-50"
      disabled={isPending}
      onClick={() => {
        startTransition(() => {
          importFromAIHot(item);
        });
      }}
    >
      {isPending ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <Download size={14} />
      )}
      导入
    </button>
  );
}
