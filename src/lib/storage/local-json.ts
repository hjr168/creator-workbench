import path from "node:path";
import { readJsonDocument, writeJsonDocument } from "@/lib/storage/json-document-store";
import type {
  Outline,
  PublishRecord,
  ReviewRecord,
  TitleCandidate,
  Topic,
  VideoScript,
} from "@/types/content";
import type { ToolRun } from "@/types/tool";
import type { CreationSession } from "@/types/workflow";

export interface WorkbenchData {
  topics: Topic[];
  creationSessions: CreationSession[];
  titleCandidates: TitleCandidate[];
  outlines: Outline[];
  videoScripts: VideoScript[];
  toolRuns: ToolRun[];
  publishRecords: PublishRecord[];
  reviewRecords: ReviewRecord[];
}

export interface DashboardStats {
  totalTopics: number;
  pendingCreation: number;
  published: number;
  pendingConfirmation: number;
}

const dataFilePath = path.join(process.cwd(), "src/data/workbench.json");
const dataDocumentKey = "workbench";

export async function getWorkbenchData(): Promise<WorkbenchData> {
  return readJsonDocument<WorkbenchData>(dataDocumentKey, dataFilePath);
}

export async function saveWorkbenchData(data: WorkbenchData) {
  await writeJsonDocument(dataDocumentKey, dataFilePath, data);
}

export function getActiveCreationSession(data: WorkbenchData) {
  return data.creationSessions.find((session) => session.status === "进行中");
}

export function getDashboardStats(data: WorkbenchData): DashboardStats {
  const activeSession = getActiveCreationSession(data);

  return {
    totalTopics: data.topics.length,
    pendingCreation: data.topics.filter((topic) => topic.status === "待创作").length,
    published: data.topics.filter((topic) => topic.status === "已发布").length,
    pendingConfirmation:
      activeSession?.decisions.filter((decision) => decision.status === "待确认").length ?? 0,
  };
}

export function findTopicById(data: WorkbenchData, topicId: string) {
  return data.topics.find((topic) => topic.id === topicId);
}

export function getTitleCandidatesForTopic(data: WorkbenchData, topicId: string) {
  return data.titleCandidates.filter((candidate) => candidate.topicId === topicId);
}

export function getConfirmedOrLatestOutline(data: WorkbenchData, topicId: string) {
  const outlines = data.outlines.filter((outline) => outline.topicId === topicId);
  return outlines.find((outline) => outline.isConfirmed) ?? outlines.at(-1);
}
