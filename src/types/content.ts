export type Platform = "小红书" | "公众号" | "视频号" | "X";

export type ContentType = "图文" | "长文" | "短视频" | "线程";

export type TopicStatus = "灵感" | "待创作" | "已发布" | "已复盘";

export type ContentDirection =
  | "产品思考"
  | "AI工具"
  | "项目管理"
  | "个人成长"
  | "自媒体实验";

export type ContentAngle =
  | "观点"
  | "案例"
  | "工具评测"
  | "方法论"
  | "项目复盘"
  | "个人实验"
  | "趋势观察";

export interface Topic {
  id: string;
  title: string;
  direction: ContentDirection;
  platforms: Platform[];
  contentType: ContentType;
  status: TopicStatus;
  tags: string[];
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TitleCandidate {
  id: string;
  topicId: string;
  platform: Platform;
  title: string;
  strategy: string;
  reason?: string;
  isSelected: boolean;
  createdAt: string;
}

export interface Outline {
  id: string;
  topicId: string;
  titleCandidateId?: string;
  opening: string;
  corePoints: string[];
  cases: string[];
  ending: string;
  callToAction: string;
  isConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VideoScene {
  id: string;
  order: number;
  visual: string;
  voiceover: string;
  note?: string;
}

export interface VideoScript {
  id: string;
  topicId: string;
  hook: string;
  scenes: VideoScene[];
  fullVoiceover: string;
  callToAction: string;
  isConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublishRecord {
  id: string;
  topicId: string;
  platform: Platform;
  publishedAt: string;
  url?: string;
  reads?: number;
  likes?: number;
  favorites?: number;
  comments?: number;
  shares?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewRecord {
  id: string;
  topicId: string;
  summary: string;
  goodSignals: string[];
  weakSignals: string[];
  nextActions: string[];
  createdAt: string;
  updatedAt: string;
}

