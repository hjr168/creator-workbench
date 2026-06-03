"use server";

import { revalidatePath } from "next/cache";
import {
  getActiveCreationSession,
  getConfirmedOrLatestOutline,
  getTitleCandidatesForTopic,
  getWorkbenchData,
  saveWorkbenchData,
} from "@/lib/storage/local-json";
import { generateWechatDraftFromSession } from "@/lib/tools/wechat-draft-generator";

const TOOL_CALL_DECISION_ID = "decision-tool-call-001";
const PREPARED_TOOL_RUN_ID = "tool-prepared-001";

export async function confirmCurrentStep() {
  const data = await getWorkbenchData();
  const activeSession = getActiveCreationSession(data);

  if (!activeSession?.topicId) {
    return;
  }

  const pendingDecision = activeSession.decisions.find((decision) => decision.status === "待确认");

  if (!pendingDecision) {
    return;
  }

  const now = new Date().toISOString();
  pendingDecision.status = "已确认";
  pendingDecision.answer = pendingDecision.answer ?? confirmationAnswer(pendingDecision.step);
  pendingDecision.updatedAt = now;

  if (pendingDecision.step === "大纲确认") {
    const outline = getConfirmedOrLatestOutline(data, activeSession.topicId);
    const selectedTitle = getTitleCandidatesForTopic(data, activeSession.topicId).find(
      (candidate) => candidate.isSelected,
    );

    if (outline) {
      outline.isConfirmed = true;
      outline.updatedAt = now;
      activeSession.confirmedOutlineId = outline.id;
    }

    activeSession.currentStep = "工具调用确认";

    if (!activeSession.decisions.some((decision) => decision.id === TOOL_CALL_DECISION_ID)) {
      activeSession.decisions.push({
        id: TOOL_CALL_DECISION_ID,
        step: "工具调用确认",
        status: "待确认",
        question: "是否将已确认标题和大纲整理为公众号推文生成输入？",
        createdAt: now,
        updatedAt: now,
      });
    }

    if (!data.toolRuns.some((toolRun) => toolRun.id === PREPARED_TOOL_RUN_ID)) {
      data.toolRuns.unshift({
        id: PREPARED_TOOL_RUN_ID,
        sessionId: activeSession.id,
        topicId: activeSession.topicId,
        toolName: "manual-command",
        status: "待确认",
        command: "待接入：根据已确认标题和大纲生成公众号 Markdown 草稿",
        inputSummary: `公众号长文生成输入：${selectedTitle?.title ?? activeSession.topicSnapshot?.title ?? "未命名选题"}`,
        outputs: [],
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  if (pendingDecision.step === "工具调用确认") {
    const preparedToolRun = data.toolRuns.find(
      (toolRun) => toolRun.sessionId === activeSession.id && toolRun.status === "待确认",
    );

    if (preparedToolRun) {
      await executeToolRun(data, activeSession.id, preparedToolRun.id);
    }

    activeSession.currentStep = "内容生成";
  }

  activeSession.updatedAt = now;
  await saveWorkbenchData(data);
  revalidatePath("/");
  revalidatePath("/creation");
  revalidatePath("/tools");
}

export async function runPreparedGeneration(toolRunId: string) {
  const data = await getWorkbenchData();
  const toolRun = data.toolRuns.find((run) => run.id === toolRunId);

  if (!toolRun?.sessionId) {
    return;
  }

  await executeToolRun(data, toolRun.sessionId, toolRun.id);
  await saveWorkbenchData(data);
  revalidatePath("/");
  revalidatePath("/creation");
  revalidatePath("/tools");
}

async function executeToolRun(data: Awaited<ReturnType<typeof getWorkbenchData>>, sessionId: string, toolRunId: string) {
  const session = data.creationSessions.find((item) => item.id === sessionId);
  const toolRun = data.toolRuns.find((run) => run.id === toolRunId);

  if (!session || !toolRun) {
    return;
  }

  const now = new Date().toISOString();
  toolRun.status = "运行中";
  toolRun.startedAt = now;
  toolRun.updatedAt = now;
  toolRun.errorMessage = undefined;

  try {
    const result = await generateWechatDraftFromSession(data, session);
    toolRun.status = "成功";
    toolRun.toolName = "wechat-article-generator";
    toolRun.command = result.command;
    toolRun.inputSummary = result.inputSummary;
    toolRun.outputs = result.outputs;
    toolRun.finishedAt = new Date().toISOString();
  } catch (error) {
    toolRun.status = "失败";
    toolRun.errorMessage = error instanceof Error ? error.message : "工具调用失败。";
    toolRun.finishedAt = new Date().toISOString();
  }

  toolRun.updatedAt = toolRun.finishedAt;
}

function confirmationAnswer(step: string) {
  switch (step) {
    case "大纲确认":
      return "已确认当前大纲，可以进入工具调用准备。";
    case "工具调用确认":
      return "已确认工具调用输入。";
    default:
      return "已确认。";
  }
}
