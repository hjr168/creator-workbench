import { fetchAIHotJob } from "@/lib/jobs/fetch-aihot";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const secret = process.env.TOPIC_RADAR_JOB_SECRET?.trim();

  // 强制校验：未配置 secret 时拒绝执行（避免公网裸奔）。
  // 本地开发若需调用该接口，也必须在 .env.local 配置 TOPIC_RADAR_JOB_SECRET。
  if (!secret) {
    return NextResponse.json(
      { error: "TOPIC_RADAR_JOB_SECRET is not configured" },
      { status: 500 },
    );
  }

  if (request.headers.get("x-job-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const log = await fetchAIHotJob({
    mode: body.mode ?? "selected",
    category: body.category,
    q: body.q,
    since: body.since,
    limit: body.limit ?? 30,
  });
  return NextResponse.json(log);
}
