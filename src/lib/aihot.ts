import type { ContentDirection } from "@/types/content";
import type { AIHotFetchMode } from "@/types/topic-radar";

const AIHOT_BASE = process.env.AIHOT_BASE_URL ?? "https://aihot.virxact.com/api/public";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 aihot-skill/0.2.0";
const DEFAULT_TIMEOUT_MS = Number(process.env.AIHOT_TIMEOUT_MS ?? "10000");
const MIN_INTERVAL_MS = Number(process.env.AIHOT_MIN_INTERVAL_MS ?? "1200");
const memoryCache = new Map<string, { expiresAt: number; data: AIHotItemsResponse }>();
let lastRequestAt = 0;

export interface AIHotItem {
  id: string;
  title: string;
  title_en: string | null;
  url: string;
  source: string;
  publishedAt: string;
  summary: string;
  category: string;
}

export interface AIHotItemsResponse {
  count: number;
  hasNext: boolean;
  nextCursor: string | null;
  items: AIHotItem[];
}

export interface FetchAIHotOptions {
  mode?: AIHotFetchMode;
  category?: string;
  q?: string;
  since?: string;
  limit?: number;
  cursor?: string;
  cacheTtlMs?: number;
}

const CATEGORY_DIRECTION_MAP: Record<string, ContentDirection> = {
  "ai-products": "AI工具",
  tip: "AI工具",
  paper: "AI工具",
  industry: "产品思考",
};

const CATEGORY_LABEL_MAP: Record<string, string> = {
  "ai-products": "AI 产品",
  tip: "技巧观点",
  paper: "论文",
  industry: "行业动态",
};

export function mapCategoryToDirection(category: string): ContentDirection {
  return CATEGORY_DIRECTION_MAP[category] ?? "AI工具";
}

export function getCategoryLabel(category: string): string {
  return CATEGORY_LABEL_MAP[category] ?? category;
}

export async function fetchSelectedItems(
  since?: string,
  limit = 20,
): Promise<AIHotItemsResponse> {
  return fetchAIHotItems({ mode: "selected", since, limit, cacheTtlMs: 5 * 60 * 1000 });
}

export async function searchAIHotItems(
  query: string,
  limit = 20,
): Promise<AIHotItemsResponse> {
  return fetchAIHotItems({ mode: "selected", q: query, limit, cacheTtlMs: 60 * 1000 });
}

export async function fetchAIHotItems(options: FetchAIHotOptions = {}): Promise<AIHotItemsResponse> {
  const params = new URLSearchParams({
    mode: options.mode ?? "selected",
    limit: String(options.limit ?? 20),
  });
  if (options.category) params.set("category", options.category);
  if (options.q) params.set("q", options.q);
  if (options.since) params.set("since", options.since);
  if (options.cursor) params.set("cursor", options.cursor);

  const url = `${AIHOT_BASE}/items?${params.toString()}`;
  const cacheKey = url;
  const ttl = options.cacheTtlMs ?? 2 * 60 * 1000;
  const cached = memoryCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  await waitForRateLimit();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  const res = await fetch(url, {
    headers: { "User-Agent": UA },
    cache: "no-store",
    signal: controller.signal,
  });
  clearTimeout(timer);

  if (!res.ok) {
    throw new Error(`AIHot API 返回 ${res.status}: ${res.statusText}`);
  }

  const data = (await res.json()) as AIHotItemsResponse;
  memoryCache.set(cacheKey, { data, expiresAt: Date.now() + ttl });
  return data;
}

async function waitForRateLimit() {
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_INTERVAL_MS - elapsed));
  }
  lastRequestAt = Date.now();
}
