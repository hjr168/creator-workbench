import { NextRequest, NextResponse } from "next/server";
import { requireMiniappToken } from "@/lib/miniapp/auth";
import {
  getMiniappTopics,
  parseMiniappAccount,
  parseMiniappLimit,
  parseMiniappRecommendationLevel,
} from "@/lib/miniapp/topic-radar";

export async function GET(request: NextRequest) {
  const unauthorized = requireMiniappToken(request);
  if (unauthorized) return unauthorized;

  const account = parseMiniappAccount(request.nextUrl.searchParams.get("account"));
  const level = parseMiniappRecommendationLevel(request.nextUrl.searchParams.get("level"));
  const limit = parseMiniappLimit(request.nextUrl.searchParams.get("limit"));
  const topics = await getMiniappTopics({ account, level, limit });

  return NextResponse.json({
    account,
    level: level ?? "全部",
    limit,
    count: topics.length,
    topics,
  });
}
