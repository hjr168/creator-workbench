import type {
  ContentAngle,
  ContentType,
  Platform,
  Topic,
} from "./content";

export type ConfirmationStatus = "待确认" | "已确认" | "需修改" | "已跳过";

export type CreationStep =
  | "灵感输入"
  | "选题确认"
  | "平台确认"
  | "内容类型确认"
  | "角度确认"
  | "标题确认"
  | "大纲确认"
  | "工具调用确认"
  | "内容生成"
  | "发布记录"
  | "数据复盘";

export interface CreationDecision {
  id: string;
  step: CreationStep;
  status: ConfirmationStatus;
  question: string;
  answer?: string;
  options?: string[];
  confirmedValue?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreationSession {
  id: string;
  topicId?: string;
  topicSnapshot?: Topic;
  currentStep: CreationStep;
  status: "进行中" | "已完成" | "已暂停" | "已取消";
  targetPlatform?: Platform;
  targetContentType?: ContentType;
  confirmedAngle?: ContentAngle;
  confirmedTitleId?: string;
  confirmedOutlineId?: string;
  decisions: CreationDecision[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface GenerationInput {
  sessionId: string;
  topicId: string;
  platform: Platform;
  contentType: ContentType;
  angle: ContentAngle;
  title: string;
  outline: string;
  notes?: string;
}

