import type { TopicRadarData } from "@/types/topic-radar";

/**
 * 取选题雷达数据最近一次更新时间（ISO 字符串）。
 *
 * 优先级：
 * 1. 最近一次成功 fetchLog.finishedAt
 * 2. 最新 sourceItem.publishedAt
 * 3. 最新 topicCard.createdAt
 * 4. 都没有则返回 undefined
 */
export function getLatestDataUpdatedAt(data: TopicRadarData): string | undefined {
  const successLog = data.fetchLogs
    .filter((log) => log.status === "success")
    .map((log) => log.finishedAt)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
  if (successLog) return successLog;

  const latestSource = data.sourceItems
    .map((item) => item.publishedAt)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
  if (latestSource) return latestSource;

  const latestCard = data.topicCards
    .map((card) => card.createdAt)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
  if (latestCard) return latestCard;

  return undefined;
}

/** 中文格式化：YYYY-MM-DD HH:mm。传入 undefined 或非法值返回「暂无更新时间」。 */
export function formatUpdatedAt(value: string | undefined): string {
  if (!value) return "暂无更新时间";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "暂无更新时间";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
