import type { ContentDirection } from "@/types/content";

const AIHOT_BASE = "https://aihot.virxact.com/api/public";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 aihot-skill/0.2.0";

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
  const params = new URLSearchParams({
    mode: "selected",
    limit: String(limit),
  });
  if (since) {
    params.set("since", since);
  }

  const res = await fetch(`${AIHOT_BASE}/items?${params.toString()}`, {
    headers: { "User-Agent": UA },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`AIHot API 返回 ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<AIHotItemsResponse>;
}

export async function searchAIHotItems(
  query: string,
  limit = 20,
): Promise<AIHotItemsResponse> {
  const params = new URLSearchParams({
    mode: "selected",
    limit: String(limit),
    q: query,
  });

  const res = await fetch(`${AIHOT_BASE}/items?${params.toString()}`, {
    headers: { "User-Agent": UA },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`AIHot 搜索 API 返回 ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<AIHotItemsResponse>;
}
