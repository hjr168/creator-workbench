"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getWorkbenchData, saveWorkbenchData } from "@/lib/storage/local-json";
import { mapCategoryToDirection, type AIHotItem } from "@/lib/aihot";
import type { ContentDirection, ContentType, Platform, Topic } from "@/types/content";
import type { CreationDecision, CreationSession } from "@/types/workflow";

const directionOptions: ContentDirection[] = ["产品思考", "AI工具", "项目管理", "个人成长", "自媒体实验"];
const contentTypeOptions: ContentType[] = ["图文", "长文", "短视频", "线程"];
const platformOptions: Platform[] = ["公众号", "小红书", "视频号", "X"];

export async function createTopicAndStart(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const direction = parseOption(formData.get("direction"), directionOptions, "产品思考");
  const contentType = parseOption(formData.get("contentType"), contentTypeOptions, "长文");
  const platforms = formData
    .getAll("platforms")
    .map((value) => String(value))
    .filter((value): value is Platform => platformOptions.includes(value as Platform));
  const tags = String(formData.get("tags") ?? "")
    .split(/[，,\s]+/)
    .map((tag) => tag.trim())
    .filter(Boolean);
  const note = String(formData.get("note") ?? "").trim();

  if (!title) {
    return;
  }

  const data = await getWorkbenchData();
  const now = new Date().toISOString();
  const topic: Topic = {
    id: `topic-${Date.now()}`,
    title,
    direction,
    platforms: platforms.length > 0 ? platforms : ["公众号"],
    contentType,
    status: "待创作",
    tags,
    note: note || undefined,
    createdAt: now,
    updatedAt: now,
  };

  data.topics.unshift(topic);

  const activeSession = data.creationSessions.find((session) => session.status === "进行中");
  if (activeSession) {
    activeSession.status = "已暂停";
    activeSession.updatedAt = now;
  }

  data.creationSessions.unshift(createSessionForTopic(topic, now));

  await saveWorkbenchData(data);
  revalidatePath("/");
  revalidatePath("/creation");
  revalidatePath("/topics");
  redirect("/creation");
}

export async function startCreationFromTopic(topicId: string) {
  const data = await getWorkbenchData();
  const topic = data.topics.find((item) => item.id === topicId);

  if (!topic) {
    return;
  }

  const now = new Date().toISOString();
  const activeSession = data.creationSessions.find((session) => session.status === "进行中");
  const existingSession = data.creationSessions.find((session) => session.topicId === topicId);

  if (activeSession && activeSession.id !== existingSession?.id) {
    activeSession.status = "已暂停";
    activeSession.updatedAt = now;
  }

  if (existingSession) {
    existingSession.status = "进行中";
    existingSession.topicSnapshot = topic;
    existingSession.updatedAt = now;
  } else {
    data.creationSessions.unshift(createSessionForTopic(topic, now));
  }

  if (topic.status === "灵感") {
    topic.status = "待创作";
    topic.updatedAt = now;
  }

  await saveWorkbenchData(data);
  revalidatePath("/");
  revalidatePath("/creation");
  revalidatePath("/topics");
  redirect("/creation");
}

function parseOption<T extends string>(value: FormDataEntryValue | null, options: T[], fallback: T): T {
  const parsed = String(value ?? "");
  return options.includes(parsed as T) ? (parsed as T) : fallback;
}

function createSessionForTopic(
  topic: Awaited<ReturnType<typeof getWorkbenchData>>["topics"][number],
  now: string,
): CreationSession {
  return {
    id: `session-${Date.now()}`,
    topicId: topic.id,
    topicSnapshot: topic,
    currentStep: "选题确认",
    status: "进行中",
    targetPlatform: topic.platforms[0],
    targetContentType: topic.contentType,
    decisions: [createTopicDecision(topic.title, now)],
    createdAt: now,
    updatedAt: now,
  };
}

export async function importFromAIHot(item: AIHotItem) {
  const data = await getWorkbenchData();

  const titleExists = data.topics.some(
    (t) => t.note?.includes(`aihot:${item.id}`),
  );
  if (titleExists) {
    revalidatePath("/topics");
    return;
  }

  const now = new Date().toISOString();
  const topic: Topic = {
    id: `topic-${Date.now()}`,
    title: item.title,
    direction: mapCategoryToDirection(item.category),
    platforms: ["公众号"],
    contentType: "长文",
    status: "待创作",
    tags: [getCategoryLabel(item.category)],
    note: [item.summary, `来源：${item.source}`, item.url, `aihot:${item.id}`]
      .filter(Boolean)
      .join("\n"),
    createdAt: now,
    updatedAt: now,
  };

  data.topics.unshift(topic);

  const activeSession = data.creationSessions.find((s) => s.status === "进行中");
  if (activeSession) {
    activeSession.status = "已暂停";
    activeSession.updatedAt = now;
  }

  data.creationSessions.unshift(createSessionForTopic(topic, now));

  await saveWorkbenchData(data);
  revalidatePath("/");
  revalidatePath("/creation");
  revalidatePath("/topics");
  redirect("/creation");
}

function getCategoryLabel(category: string): string {
  const map: Record<string, string> = {
    "ai-products": "AI产品",
    tip: "AI技巧",
    paper: "AI论文",
    industry: "行业动态",
  };
  return map[category] ?? category;
}

function createTopicDecision(topicTitle: string, now: string): CreationDecision {
  return {
    id: `decision-topic-${Date.now()}`,
    step: "选题确认",
    status: "待确认",
    question: `是否把「${topicTitle}」作为当前要推进的选题？`,
    createdAt: now,
    updatedAt: now,
  };
}
