"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isSignedIn } from "@/lib/auth/admin-session";
import { fetchAIHotJob, refreshDailyReport, rescoreSourceItem } from "@/lib/jobs/fetch-aihot";
import type { AIHotFetchMode } from "@/types/topic-radar";

/** server action 鉴权：未登录直接跳转登录页。redirect() 会抛出特殊异常终止执行。 */
async function requireAdmin() {
  if (!(await isSignedIn())) {
    redirect("/admin-login");
  }
}

export async function runAIHotFetch(formData: FormData) {
  await requireAdmin();
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
  await requireAdmin();
  await rescoreSourceItem(sourceItemId);
  revalidatePath("/");
  revalidatePath("/topics");
  revalidatePath("/admin");
  revalidatePath(`/topics/${sourceItemId}`);
}

export async function refreshDailyReportAction() {
  await requireAdmin();
  await refreshDailyReport();
  revalidatePath("/admin");
}
