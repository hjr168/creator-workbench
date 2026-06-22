/** 用户对选题卡的轻量反馈类型（无需登录）。 */
export type TopicFeedbackType = "useful" | "not_useful" | "fact_issue";

export const TOPIC_FEEDBACK_TYPES: readonly TopicFeedbackType[] = [
  "useful",
  "not_useful",
  "fact_issue",
] as const;

/** 用户对选题卡的单条反馈。不记录用户身份、IP 等隐私信息。 */
export interface TopicFeedback {
  id: string;
  topicCardId: string;
  type: TopicFeedbackType;
  createdAt: string;
  userAgent?: string;
}
