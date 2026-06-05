"use server";

import { revalidatePath } from "next/cache";
import type { ContentAngle, ContentDirection, Topic } from "@/types/content";import {
  getActiveCreationSession,
  getConfirmedOrLatestOutline,
  getTitleCandidatesForTopic,
  getWorkbenchData,
  saveWorkbenchData,
} from "@/lib/storage/local-json";
import { generateWechatDraftFromSession } from "@/lib/tools/wechat-draft-generator";

const TOOL_CALL_DECISION_ID = "decision-tool-call-001";

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

  if (pendingDecision.step === "选题确认" && activeSession.topicSnapshot) {
    prepareTopicPlanningData(data, activeSession.topicSnapshot, activeSession.id, now);
    activeSession.currentStep = "角度确认";

    if (!activeSession.decisions.some((decision) => decision.step === "角度确认")) {
      const suggestedAngle = activeSession.confirmedAngle ?? inferAngle(activeSession.topicSnapshot.direction);
      activeSession.decisions.push({
        id: `decision-angle-${Date.now()}`,
        step: "角度确认",
        status: "待确认",
        question: "这个选题先按哪个角度推进？",
        options: ["观点", "案例", "工具评测", "方法论", "项目复盘", "个人实验", "趋势观察"],
        confirmedValue: suggestedAngle,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (!activeSession.decisions.some((decision) => decision.step === "标题确认")) {
      const titleCandidates = data.titleCandidates.filter(
        (candidate) => candidate.topicId === activeSession.topicId,
      );

      activeSession.decisions.push({
        id: `decision-title-${Date.now()}`,
        step: "标题确认",
        status: "待确认",
        question: "选择一个标题候选，或输入自定义标题。",
        options: titleCandidates.map((c) => c.title),
        createdAt: now,
        updatedAt: now,
      });
    }
  }

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

    ensurePreparedToolRun(data, activeSession.id, activeSession.topicId, selectedTitle?.title ?? activeSession.topicSnapshot?.title, now);
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

export async function reeditDecision(decisionId: string) {
  const data = await getWorkbenchData();
  const activeSession = getActiveCreationSession(data);
  if (!activeSession) return;

  const decision = activeSession.decisions.find((d) => d.id === decisionId);
  if (!decision || decision.status !== "已确认") return;

  const now = new Date().toISOString();
  decision.status = "待确认";
  decision.answer = undefined;
  decision.updatedAt = now;

  if (decision.step === "角度确认" && !decision.options) {
    decision.options = ["观点", "案例", "工具评测", "方法论", "项目复盘", "个人实验", "趋势观察"];
  }

  if (decision.step === "标题确认") {
    const candidates = data.titleCandidates.filter((c) => c.topicId === activeSession.topicId);
    decision.options = candidates.map((c) => c.title);
  }

  activeSession.decisions.forEach((d) => {
    if (d.id !== decisionId && d.status === "待确认") {
      d.status = "已跳过";
      d.answer = "因上游重新编辑而跳过。";
      d.updatedAt = now;
    }
  });

  const stepsAfter = ["选题确认", "角度确认", "标题确认", "大纲确认", "工具调用确认"];
  const currentIndex = stepsAfter.indexOf(decision.step);
  if (currentIndex >= 0) {
    const laterDecisions = activeSession.decisions.filter((d) => {
      const idx = stepsAfter.indexOf(d.step);
      return idx > currentIndex;
    });
    for (const ld of laterDecisions) {
      if (ld.status === "已确认") {
        ld.status = "待确认";
        ld.answer = undefined;
        ld.updatedAt = now;
      }
    }
  }

  activeSession.currentStep = decision.step as typeof activeSession.currentStep;
  activeSession.updatedAt = now;

  await saveWorkbenchData(data);
  revalidatePath("/");
  revalidatePath("/creation");
}

export async function switchTitle(candidateId: string) {
  const data = await getWorkbenchData();
  const activeSession = getActiveCreationSession(data);
  if (!activeSession?.topicId) return;

  const candidate = data.titleCandidates.find((c) => c.id === candidateId);
  if (!candidate || candidate.topicId !== activeSession.topicId) return;

  const now = new Date().toISOString();
  data.titleCandidates.forEach((c) => {
    if (c.topicId === activeSession.topicId) c.isSelected = c.id === candidateId;
  });
  activeSession.confirmedTitleId = candidateId;

  const titleDecision = activeSession.decisions.find((d) => d.step === "标题确认");
  if (titleDecision) {
    titleDecision.confirmedValue = candidate.title;
    if (titleDecision.status === "已确认") {
      titleDecision.answer = `选择「${candidate.title}」作为标题。`;
    }
    titleDecision.updatedAt = now;
  }

  activeSession.updatedAt = now;
  await saveWorkbenchData(data);
  revalidatePath("/");
  revalidatePath("/creation");
}

export async function confirmAngle(angle: string, customAngle?: string) {
  const data = await getWorkbenchData();
  const activeSession = getActiveCreationSession(data);
  if (!activeSession) return;

  const decision = activeSession.decisions.find((d) => d.step === "角度确认" && d.status === "待确认");
  if (!decision) return;

  const chosen = (customAngle?.trim() || angle) as ContentAngle;
  const now = new Date().toISOString();
  decision.status = "已确认";
  decision.answer = `按「${chosen}」推进，后续可在大纲里继续调整。`;
  decision.confirmedValue = chosen;
  decision.updatedAt = now;

  activeSession.confirmedAngle = chosen;
  activeSession.currentStep = "标题确认";
  activeSession.updatedAt = now;

  await saveWorkbenchData(data);
  revalidatePath("/creation");
}

export async function confirmTitle(title: string, customTitle?: string) {
  const data = await getWorkbenchData();
  const activeSession = getActiveCreationSession(data);
  if (!activeSession?.topicId) return;

  const decision = activeSession.decisions.find((d) => d.step === "标题确认" && d.status === "待确认");
  if (!decision) return;

  const chosen = customTitle?.trim() || title;
  const now = new Date().toISOString();
  decision.status = "已确认";
  decision.answer = `选择「${chosen}」作为标题。`;
  decision.confirmedValue = chosen;
  decision.updatedAt = now;

  const matchingCandidate = data.titleCandidates.find(
    (c) => c.topicId === activeSession.topicId && c.title === chosen,
  );

  if (matchingCandidate) {
    data.titleCandidates.forEach((c) => {
      if (c.topicId === activeSession.topicId) c.isSelected = c.id === matchingCandidate.id;
    });
    activeSession.confirmedTitleId = matchingCandidate.id;
  } else {
    const newCandidate = {
      id: `title-${Date.now()}`,
      topicId: activeSession.topicId,
      platform: activeSession.targetPlatform ?? "公众号",
      title: chosen,
      strategy: "自定义",
      isSelected: true,
      createdAt: now,
    };
    data.titleCandidates.forEach((c) => {
      if (c.topicId === activeSession.topicId) c.isSelected = false;
    });
    data.titleCandidates.push(newCandidate);
    activeSession.confirmedTitleId = newCandidate.id;
  }

  activeSession.currentStep = "大纲确认";
  activeSession.updatedAt = now;

  if (!activeSession.decisions.some((d) => d.step === "大纲确认")) {
    activeSession.decisions.push({
      id: `decision-outline-${Date.now()}`,
      step: "大纲确认",
      status: "待确认",
      question: "是否确认当前大纲并准备生成公众号草稿？",
      createdAt: now,
      updatedAt: now,
    });
  }

  await saveWorkbenchData(data);
  revalidatePath("/");
  revalidatePath("/creation");
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

export async function runActiveGeneration() {
  const data = await getWorkbenchData();
  const activeSession = getActiveCreationSession(data);

  if (!activeSession?.topicId) {
    return;
  }

  const now = new Date().toISOString();
  const selectedTitle = data.titleCandidates.find(
    (candidate) => candidate.topicId === activeSession.topicId && candidate.isSelected,
  );
  const toolRun = ensurePreparedToolRun(
    data,
    activeSession.id,
    activeSession.topicId,
    selectedTitle?.title ?? activeSession.topicSnapshot?.title,
    now,
  );

  await executeToolRun(data, activeSession.id, toolRun.id);
  activeSession.currentStep = "内容生成";
  activeSession.updatedAt = now;
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

function ensurePreparedToolRun(
  data: Awaited<ReturnType<typeof getWorkbenchData>>,
  sessionId: string,
  topicId: string,
  title: string | undefined,
  now: string,
) {
  const existingToolRun = data.toolRuns.find((toolRun) => toolRun.sessionId === sessionId);

  if (existingToolRun) {
    return existingToolRun;
  }

  const toolRun = {
    id: preparedToolRunId(sessionId),
    sessionId,
    topicId,
    toolName: "manual-command" as const,
    status: "待确认" as const,
    command: "待接入：根据已确认标题和大纲生成公众号 Markdown 草稿",
    inputSummary: `公众号长文生成输入：${title ?? "未命名选题"}`,
    outputs: [],
    createdAt: now,
    updatedAt: now,
  };

  data.toolRuns.unshift(toolRun);
  return toolRun;
}

function confirmationAnswer(step: string) {
  switch (step) {
    case "选题确认":
      return "已确认作为当前推进选题。";
    case "大纲确认":
      return "已确认当前大纲，可以进入工具调用准备。";
    case "工具调用确认":
      return "已确认工具调用输入。";
    default:
      return "已确认。";
  }
}

function prepareTopicPlanningData(
  data: Awaited<ReturnType<typeof getWorkbenchData>>,
  topic: Topic,
  sessionId: string,
  now: string,
) {
  if (!data.titleCandidates.some((candidate) => candidate.topicId === topic.id)) {
    data.titleCandidates.push(
      {
        id: `title-${Date.now()}-1`,
        topicId: topic.id,
        platform: topic.platforms[0],
        title: topic.title,
        strategy: "原题推进",
        reason: "保留选题原始判断，适合先进入大纲确认。",
        isSelected: true,
        createdAt: now,
      },
      {
        id: `title-${Date.now()}-2`,
        topicId: topic.id,
        platform: topic.platforms[0],
        title: `我是如何理解：${topic.title}`,
        strategy: "经验拆解",
        reason: "更适合个人 IP 的第一人称经验表达。",
        isSelected: false,
        createdAt: now,
      },
      {
        id: `title-${Date.now()}-3`,
        topicId: topic.id,
        platform: topic.platforms[0],
        title: `${topic.title}：从想法到稳定流程`,
        strategy: "方法论沉淀",
        reason: "强调可复用流程，适合后续生成长文草稿。",
        isSelected: false,
        createdAt: now,
      },
    );
  }

  const selectedTitle = data.titleCandidates.find((candidate) => candidate.topicId === topic.id && candidate.isSelected);

  if (!data.outlines.some((outline) => outline.topicId === topic.id)) {
    data.outlines.push({
      id: `outline-${Date.now()}-${sessionId}`,
      topicId: topic.id,
      titleCandidateId: selectedTitle?.id,
      opening: topic.note ?? `这个选题来自「${topic.direction}」方向，适合先从真实工作场景切入。`,
      corePoints: [
        `这个选题的核心不是单点技巧，而是「${topic.direction}」背后的长期判断。`,
        `先把问题、场景和个人经验讲清楚，再进入具体方法。`,
        `最后把这次内容沉淀成下一轮选题和复盘依据。`,
      ],
      cases: [
        `结合当前内容工作台，说明「${topic.title}」如何从灵感进入确认流程。`,
        "用一次真实创作流程展示选题、标题、大纲、生成和复盘之间的关系。",
      ],
      ending: "一个稳定的内容系统，价值不在于一次生成，而在于每次都能留下可复用的判断。",
      callToAction: "如果你也在搭建个人内容系统，可以先从一个选题确认流程开始。",
      isConfirmed: false,
      createdAt: now,
      updatedAt: now,
    });
  }
}

function inferAngle(direction: ContentDirection): ContentAngle {
  switch (direction) {
    case "AI工具":
      return "方法论";
    case "项目管理":
      return "观点";
    case "自媒体实验":
      return "个人实验";
    case "个人成长":
      return "案例";
    case "产品思考":
    default:
      return "观点";
  }
}

function preparedToolRunId(sessionId: string) {
  return `tool-prepared-${sessionId}`;
}
