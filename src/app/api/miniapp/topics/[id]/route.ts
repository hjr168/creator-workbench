import { NextRequest, NextResponse } from "next/server";
import { requireMiniappToken } from "@/lib/miniapp/auth";
import { getMiniappTopicDetail, parseMiniappAccount } from "@/lib/miniapp/topic-radar";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<unknown> },
) {
  const unauthorized = requireMiniappToken(request);
  if (unauthorized) return unauthorized;

  const routeParams = (await params) as { id?: string };
  const id = routeParams.id ?? "";
  const account = parseMiniappAccount(request.nextUrl.searchParams.get("account"));
  const topic = await getMiniappTopicDetail(id, account);

  if (!topic) {
    return NextResponse.json({ error: "topic not found" }, { status: 404 });
  }

  return NextResponse.json({ account, topic });
}
