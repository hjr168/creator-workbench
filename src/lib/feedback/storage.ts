import { randomUUID } from "node:crypto";
import { getWorkbenchData, saveWorkbenchData } from "@/lib/storage/local-json";
import type { TopicFeedback, TopicFeedbackType } from "@/types/feedback";

/**
 * 选题反馈存储（基于现有 json-document-store / PostgreSQL JSON 文档模式）。
 *
 * 反馈存在 workbench 文档的 topicFeedbacks 字段。
 * 生产环境无 DATABASE_URL 时，写操作由 json-document-store 统一拒绝（抛错）。
 *
 * 隐私：不记录用户身份、IP；userAgent 可选记录。
 */

/** 追加一条反馈。每次只新增，不做去重。 */
export async function addTopicFeedback(input: {
  topicCardId: string;
  type: TopicFeedbackType;
  userAgent?: string;
}): Promise<TopicFeedback> {
  const data = await getWorkbenchData();
  const feedback: TopicFeedback = {
    id: randomUUID(),
    topicCardId: input.topicCardId,
    type: input.type,
    createdAt: new Date().toISOString(),
    ...(input.userAgent ? { userAgent: input.userAgent } : {}),
  };
  data.topicFeedbacks = [...data.topicFeedbacks, feedback];
  await saveWorkbenchData(data);
  return feedback;
}

/** 返回全部反馈（按时间倒序），供后台统计使用。 */
export async function getTopicFeedbacks(): Promise<TopicFeedback[]> {
  const data = await getWorkbenchData();
  return [...data.topicFeedbacks].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
