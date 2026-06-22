import { NextRequest, NextResponse } from "next/server";
import { requireMiniappToken } from "@/lib/miniapp/auth";
import { getLatestMiniappDailyReport } from "@/lib/miniapp/topic-radar";

export async function GET(request: NextRequest) {
  const unauthorized = requireMiniappToken(request);
  if (unauthorized) return unauthorized;

  const report = await getLatestMiniappDailyReport();

  if (!report) {
    return NextResponse.json({ error: "daily report not found" }, { status: 404 });
  }

  return NextResponse.json({ report });
}
