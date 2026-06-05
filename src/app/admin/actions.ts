"use server";

import { revalidatePath } from "next/cache";
import { fetchAIHotJob, refreshDailyReport, rescoreSourceItem } from "@/lib/jobs/fetch-aihot";
import type { AIHotFetchMode } from "@/types/topic-radar";

export async function runAIHotFetch(formData: FormData) {
  const mode = String(formData.get("mode") ?? "selected") as AIHotFetchMode;
  const category = String(formData.get("category") ?? "").trim() || undefined;
  const q = String(formData.get("q") ?? "").trim() || undefined;
  const since = String(formData.get("since") ?? "").trim() || undefined;
  const limit = Number(formData.get("limit") ?? "30");
  await fetchAIHotJob({ mode, category, q, since, limit: Number.isFinite(limit) ? limit : 30 });
  revalidatePath("/");
  revalidatePath("/topics");
  revalidatePath("/admin");
}

export async function rescoreAction(sourceItemId: string) {
  await rescoreSourceItem(sourceItemId);
  revalidatePath("/");
  revalidatePath("/topics");
  revalidatePath("/admin");
  revalidatePath(`/topics/${sourceItemId}`);
}

export async function refreshDailyReportAction() {
  await refreshDailyReport();
  revalidatePath("/admin");
}
