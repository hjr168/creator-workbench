import { fetchAIHotJob } from "@/lib/jobs/fetch-aihot";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const secret = process.env.TOPIC_RADAR_JOB_SECRET;
  if (secret && request.headers.get("x-job-secret") !== secret) {
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
