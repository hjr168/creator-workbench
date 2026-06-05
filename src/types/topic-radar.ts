export type AIHotFetchMode = "selected" | "all";

export type AccountType =
  | "AI科普号"
  | "产品经理/SaaS号"
  | "职场效率号"
  | "创业商业号"
  | "技术开发者号";

export type RecommendationLevel = "强烈推荐" | "适合追热点" | "适合写深度" | "可关注" | "暂不建议";

export interface SourceItem {
  id: string;
  provider: "aihot" | "rss" | "manual";
  providerItemId: string;
  title: string;
  url: string;
  sourceName: string;
  publishedAt: string;
  summary?: string;
  category?: string;
  raw: unknown;
  contentHash: string;
  firstSeenAt: string;
  updatedAt: string;
}

export interface HKRScore {
  id: string;
  sourceItemId: string;
  h: number;
  k: number;
  r: number;
  total: number;
  level: RecommendationLevel;
  reasons: {
    h: string;
    k: string;
    r: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TopicCard {
  id: string;
  sourceItemId: string;
  title: string;
  oneLineSummary: string;
  whyWorthWriting: string;
  recommendedTitles: string[];
  writingAngles: string[];
  outline: string[];
  suitableAccounts: AccountType[];
  difficulty: "低" | "中" | "高";
  factsToVerify: string[];
  extendableViews: string[];
  risks: string[];
  recommendedApproach: string;
  generatedBy: "heuristic" | "llm";
  createdAt: string;
  updatedAt: string;
}

export interface FetchLog {
  id: string;
  provider: "aihot" | "rss";
  mode: string;
  params: Record<string, string>;
  status: "success" | "failed";
  fetchedCount: number;
  insertedCount: number;
  dedupedCount: number;
  error?: string;
  startedAt: string;
  finishedAt: string;
}

export interface TopicRadarData {
  sourceItems: SourceItem[];
  hkrScores: HKRScore[];
  topicCards: TopicCard[];
  fetchLogs: FetchLog[];
  dailyReports: DailyReport[];
}

export interface DailyReport {
  id: string;
  reportDate: string;
  markdown: string;
  itemIds: string[];
  createdAt: string;
}

export interface TopicRadarItem {
  source: SourceItem;
  score: HKRScore;
  card: TopicCard;
}
