/**
 * ⚠️ 本文件的类型是小程序端独立副本，与后端权威定义保持字段一致：
 *   src/lib/miniapp/topic-radar.ts（MiniappTopicListItem / MiniappTopicDetail / MiniappDailyReport）
 *   src/types/topic-radar.ts（AccountType / RecommendationLevel）
 *
 * 修改后端类型时必须同步本文件，否则小程序类型会与后端返回对不上。
 */

export type AccountType =
  | "AI科普号"
  | "产品经理/SaaS号"
  | "职场效率号"
  | "创业商业号"
  | "技术开发者号";

export type RecommendationLevel = "强烈推荐" | "适合追热点" | "适合写深度" | "可关注" | "暂不建议";

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

export interface TopicListResponse {
  account: AccountType;
  level: RecommendationLevel | "全部";
  limit: number;
  count: number;
  topics: MiniappTopicListItem[];
}

export interface TopicDetailResponse {
  account: AccountType;
  topic: MiniappTopicDetail;
}

export interface DailyReportResponse {
  report: MiniappDailyReport;
}
