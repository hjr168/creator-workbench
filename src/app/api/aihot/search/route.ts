import { searchAIHotItems } from "@/lib/aihot";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "20");

  if (!q.trim()) {
    return NextResponse.json({ error: "请输入搜索关键字" }, { status: 400 });
  }

  try {
    const result = await searchAIHotItems(q, limit);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "搜索失败" },
      { status: 502 },
    );
  }
}

