import Taro from "@tarojs/taro";
import type {
  AccountType,
  DailyReportResponse,
  RecommendationLevel,
  TopicDetailResponse,
  TopicListResponse,
} from "@/types/topic-radar";
import { AbortError, type MiniAbortSignal } from "@/services/abort";

const API_BASE = process.env.TARO_APP_API_BASE || "http://127.0.0.1:3000";

/**
 * 可选访问令牌。配置后所有请求会携带 `x-miniapp-token` header，
 * 需与后端环境变量 MINIAPP_API_TOKEN 保持一致。
 * 通过 `TARO_APP_MINIAPP_TOKEN` 在构建期注入；未配置时后端放行（本地开发）。
 */
const API_TOKEN = process.env.TARO_APP_MINIAPP_TOKEN || "";

export const accountOptions: AccountType[] = [
  "AI科普号",
  "产品经理/SaaS号",
  "职场效率号",
  "创业商业号",
  "技术开发者号",
];

export const levelOptions: Array<RecommendationLevel | "全部"> = [
  "全部",
  "强烈推荐",
  "适合追热点",
  "适合写深度",
  "可关注",
  "暂不建议",
];

/** 默认每页条数，用于分页加载 */
export const PAGE_SIZE = 20;

export interface RequestOptions {
  /** 用于取消请求，避免竞态覆盖 */
  signal?: MiniAbortSignal;
}

export async function fetchTopics(
  params: {
    account: AccountType;
    level?: RecommendationLevel | "全部";
    limit?: number;
  },
  options: RequestOptions = {},
) {
  return request<TopicListResponse>(
    "/api/miniapp/topics",
    {
      account: params.account,
      level: params.level ?? "全部",
      limit: String(params.limit ?? PAGE_SIZE),
    },
    options,
  );
}

export async function fetchTopicDetail(
  id: string,
  account: AccountType,
  options: RequestOptions = {},
) {
  return request<TopicDetailResponse>(
    `/api/miniapp/topics/${encodeURIComponent(id)}`,
    { account },
    options,
  );
}

export async function fetchLatestDailyReport(options: RequestOptions = {}) {
  return request<DailyReportResponse>("/api/miniapp/daily-report/latest", undefined, options);
}

export function getApiBase() {
  return API_BASE;
}

/** 带竞态保护的请求封装。AbortSignal 取消时抛出 AbortError，调用方可据此跳过状态更新。 */
async function request<T>(
  path: string,
  data?: Record<string, string>,
  options: RequestOptions = {},
) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (API_TOKEN) headers["x-miniapp-token"] = API_TOKEN;

  const response = await Taro.request<T>({
    url: `${API_BASE}${path}`,
    method: "GET",
    data,
    header: headers,
    timeout: 10000,
  });

  // 微信 request 本身不直接消费 AbortSignal，这里通过信号检查模拟取消语义，
  // 配合调用方的 AbortController 实现竞态丢弃（请求已发出但结果被丢弃）。
  if (options.signal?.aborted) {
    throw new AbortError();
  }

  if (response.statusCode === 401) {
    throw new Error("未授权访问，请检查小程序令牌配置");
  }

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(getErrorMessage(response.data) || `请求失败：${response.statusCode}`);
  }

  return response.data;
}

function getErrorMessage(data: unknown) {
  if (data && typeof data === "object" && "error" in data) {
    const error = (data as { error?: unknown }).error;
    return typeof error === "string" ? error : undefined;
  }
  return undefined;
}
