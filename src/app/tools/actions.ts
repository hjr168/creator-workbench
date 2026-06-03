"use server";

import { revalidatePath } from "next/cache";
import { getWorkbenchData, saveWorkbenchData } from "@/lib/storage/local-json";

export async function markToolRunGenerated(formData: FormData) {
  const toolRunId = String(formData.get("toolRunId") ?? "");

  if (!toolRunId) {
    return;
  }

  const data = await getWorkbenchData();
  const toolRun = data.toolRuns.find((run) => run.id === toolRunId);

  if (!toolRun) {
    return;
  }

  const now = new Date().toISOString();
  toolRun.status = "成功";
  toolRun.finishedAt = now;
  toolRun.updatedAt = now;

  const session = toolRun.sessionId
    ? data.creationSessions.find((item) => item.id === toolRun.sessionId)
    : undefined;

  if (session) {
    session.currentStep = "发布记录";
    session.updatedAt = now;
  }

  await saveWorkbenchData(data);
  revalidatePath("/");
  revalidatePath("/creation");
  revalidatePath("/tools");
}

