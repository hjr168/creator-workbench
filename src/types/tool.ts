export type ToolRunStatus =
  | "待确认"
  | "准备中"
  | "运行中"
  | "成功"
  | "失败"
  | "已取消";

export type ToolName =
  | "wechat-article-generator"
  | "wechat-html-preview"
  | "wechat-draft-upload"
  | "manual-command";

export interface ToolOutput {
  id: string;
  label: string;
  kind: "markdown" | "html" | "image" | "json" | "log" | "url" | "other";
  path?: string;
  url?: string;
  description?: string;
}

export interface ToolRun {
  id: string;
  sessionId?: string;
  topicId?: string;
  toolName: ToolName;
  status: ToolRunStatus;
  command?: string;
  inputSummary: string;
  outputs: ToolOutput[];
  errorMessage?: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ToolAdapterCommand {
  toolName: ToolName;
  command: string;
  workingDirectory: string;
  inputSummary: string;
  expectedOutputs: Omit<ToolOutput, "id">[];
}

