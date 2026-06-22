import { accountTypeOptions, scoreForAccount } from "@/lib/topic-radar/hkr";
import { findTopicRadarItem, getTopicRadarData, getTopicRadarItems } from "@/lib/topic-radar/storage";
import type { AccountType, RecommendationLevel, TopicRadarItem } from "@/types/topic-radar";

/**
 * ⚠️ 本文件是 miniapp 接口类型的权威定义。
 * 小程序端有独立副本：miniapp/src/types/topic-radar.ts
 * 修改下面的 interface 时必须同步小程序端副本，否则两端类型会漂移。
 */

export const miniappRecommendationLevels = [
  "强烈推荐",
  "适合追热点",
  "适合写深度",
  "可关注",
  "暂不建议",
] as const satisfies readonly RecommendationLevel[];

export interface MiniappTopicListItem {
  id: string;
  title: string;
  oneLineSummary: string;
  recommendationLevel: RecommendationLevel;
  accountScore: number;
  hkr: {
    h: number;
    k: number;
    r: number;
    total: number;
  };
  source: {
    name: string;
    provider: string;
    publishedAt: string;
    category?: string;
  };
  tags: string[];
  recommendedApproach: string;
  difficulty: "低" | "中" | "高";
}

export interface MiniappTopicDetail extends MiniappTopicListItem {
  source: MiniappTopicListItem["source"] & {
    url: string;
  };
  whyWorthWriting: string;
  recommendedTitles: string[];
  writingAngles: string[];
  outline: string[];
  suitableAccounts: AccountType[];
  factsToVerify: string[];
  extendableViews: string[];
  risks: string[];
  scoreReasons: {
    h: string;
    k: string;
    r: string;
  };
}

export interface MiniappDailyReport {
  id: string;
  reportDate: string;
  markdown: string;
  itemIds: string[];
  createdAt: string;
}

export function parseMiniappAccount(value: string | null): AccountType {
  return accountTypeOptions.includes(value as AccountType) ? (value as AccountType) : "AI科普号";
}

export function parseMiniappRecommendationLevel(value: string | null) {
  if (!value || value === "全部") return undefined;
  return miniappRecommendationLevels.includes(value as RecommendationLevel)
    ? (value as RecommendationLevel)
    : undefined;
}

export function parseMiniappLimit(value: string | null, fallback = 30) {
  const limit = Number(value ?? fallback);
  if (!Number.isFinite(limit)) return fallback;
  return Math.max(1, Math.min(100, Math.trunc(limit)));
}

export async function getMiniappTopics({
  account,
  level,
  limit,
}: {
  account: AccountType;
  level?: RecommendationLevel;
  limit: number;
}) {
  const items = await getTopicRadarItems();
  return items
    .filter((item) => !level || item.score.level === level)
    .sort((a, b) => scoreForAccount(b.score, account) - scoreForAccount(a.score, account))
    .slice(0, limit)
    .map((item) => toMiniappTopicListItem(item, account));
}

export async function getMiniappTopicDetail(id: string, account: AccountType) {
  const item = await findTopicRadarItem(id);
  return item ? toMiniappTopicDetail(item, account) : undefined;
}

export async function getLatestMiniappDailyReport(): Promise<MiniappDailyReport | undefined> {
  const data = await getTopicRadarData();
  const latest = data.dailyReports[0];
  if (!latest) return undefined;

  return {
    id: latest.id,
    reportDate: latest.reportDate,
    markdown: latest.markdown,
    itemIds: latest.itemIds,
    createdAt: latest.createdAt,
  };
}

function toMiniappTopicListItem(item: TopicRadarItem, account: AccountType): MiniappTopicListItem {
  const category = item.source.category ?? "AI";
  const tags = [category, item.card.recommendedApproach, ...item.card.suitableAccounts.slice(0, 2)];

  return {
    id: item.card.id,
    title: item.card.title,
    oneLineSummary: item.card.oneLineSummary,
    recommendationLevel: item.score.level,
    accountScore: scoreForAccount(item.score, account),
    hkr: {
      h: item.score.h,
      k: item.score.k,
      r: item.score.r,
      total: item.score.total,
    },
    source: {
      name: item.source.sourceName,
      provider: item.source.provider,
      publishedAt: item.source.publishedAt,
      category: item.source.category,
    },
    tags,
    recommendedApproach: item.card.recommendedApproach,
    difficulty: item.card.difficulty,
  };
}

function toMiniappTopicDetail(item: TopicRadarItem, account: AccountType): MiniappTopicDetail {
  return {
    ...toMiniappTopicListItem(item, account),
    source: {
      name: item.source.sourceName,
      provider: item.source.provider,
      publishedAt: item.source.publishedAt,
      category: item.source.category,
      url: item.source.url,
    },
    whyWorthWriting: item.card.whyWorthWriting,
    recommendedTitles: item.card.recommendedTitles,
    writingAngles: item.card.writingAngles,
    outline: item.card.outline,
    suitableAccounts: item.card.suitableAccounts,
    factsToVerify: item.card.factsToVerify,
    extendableViews: item.card.extendableViews,
    risks: item.card.risks,
    scoreReasons: item.score.reasons,
  };
}
