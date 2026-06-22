import { NextRequest, NextResponse } from "next/server";

const HEADER_NAME = "x-miniapp-token";

/**
 * 校验小程序端请求的访问令牌。
 *
 * 令牌通过环境变量 MINIAPP_API_TOKEN 配置。
 * - 配置了令牌：请求必须携带 `x-miniapp-token` header 且值匹配，否则返回 401。
 * - 未配置令牌（本地开发）：放行所有请求，便于联调。
 *
 * 返回 null 表示校验通过，否则返回一个可直接 return 的 401 响应。
 */
export function requireMiniappToken(request: NextRequest): NextResponse | null {
  const expected = process.env.MINIAPP_API_TOKEN;
  if (!expected) return null;

  const provided = request.headers.get(HEADER_NAME);
  if (provided !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}
