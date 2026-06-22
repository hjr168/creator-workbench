import { NextResponse, type NextRequest } from "next/server";
import { addTopicFeedback } from "@/lib/feedback/storage";
import { findTopicRadarItem } from "@/lib/topic-radar/storage";
import { TOPIC_FEEDBACK_TYPES, type TopicFeedbackType } from "@/types/feedback";

// 限制请求体大小，避免大 payload；反馈只需要两个短字段。
const MAX_BODY_BYTES = 4 * 1024;

function isFeedbackType(value: unknown): value is TopicFeedbackType {
  return typeof value === "string" && (TOPIC_FEEDBACK_TYPES as readonly string[]).includes(value);
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength && contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "request body too large" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const topicCardId =
    typeof body === "object" && body !== null && "topicCardId" in body
      ? String((body as { topicCardId: unknown }).topicCardId ?? "").trim()
      : "";
  const type =
    typeof body === "object" && body !== null && "type" in body ? (body as { type: unknown }).type : undefined;

  if (!topicCardId) {
    return NextResponse.json({ error: "topicCardId is required" }, { status: 400 });
  }
  if (!isFeedbackType(type)) {
    return NextResponse.json(
      { error: "type must be one of: useful, not_useful, fact_issue" },
      { status: 400 },
    );
  }

  // 选题卡必须存在，否则 404。
  const item = await findTopicRadarItem(topicCardId);
  if (!item) {
    return NextResponse.json({ error: "topic card not found" }, { status: 404 });
  }

  const userAgent = request.headers.get("user-provider") ?? request.headers.get("user-agent") ?? undefined;
  await addTopicFeedback({ topicCardId, type, userAgent });

  return NextResponse.json({ ok: true });
}
