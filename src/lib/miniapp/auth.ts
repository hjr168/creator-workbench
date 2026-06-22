import { NextRequest, NextResponse } from "next/server";

const HEADER_NAME = "x-miniapp-token";

/**
 * 校验小程序端请求的访问令牌。
 *
 * 访问策略（公开免费 MVP）：
 * - 这些是只读公开 API（选题列表 / 详情 / 最新日报），内容与普通网页端一致，
 *   适合公开展示。因此未配置令牌时默认放行，便于公开免费试用。
 * - 如果希望只允许小程序访问、避免第三方直接调用，请配置 MINIAPP_API_TOKEN，
 *   并在小程序构建时注入 TARO_APP_MINIAPP_TOKEN（见 miniapp/.env.example）。
 *
 * 令牌通过环境变量 MINIAPP_API_TOKEN 配置：
 * - 配置了令牌：请求必须携带 `x-miniapp-token` header 且值匹配，否则返回 401。
 * - 未配置令牌：放行所有请求（本地开发与公开只读 MVP 均适用）。
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
