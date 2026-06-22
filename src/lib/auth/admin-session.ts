import { cookies } from "next/headers";

/**
 * 轻量级管理员会话（零依赖，适合单人 MVP）。
 *
 * 工作方式：
 * - 管理员密码来自环境变量 ADMIN_PASSWORD。
 * - 登录成功后写入 httpOnly cookie cw_admin，值为 `<passwordHash>.<expiresAtMs>`。
 *   passwordHash = sha256(ADMIN_PASSWORD + ADMIN_COOKIE_SECRET)，避免明文密码进 cookie。
 * - 未配置 ADMIN_PASSWORD 时，整个后台处于「未启用」状态——
 *   校验一律返回 false，登录页提示未配置。
 *
 * 这不是用户系统，只是保护单人后台的门槛。
 *
 * 实现说明：使用 Web Crypto API（crypto.subtle）而非 node:crypto，
 * 因为本模块会被 middleware.ts（Edge Runtime）导入，而 Edge Runtime 不支持
 * node: 原生模块（Next.js 16 + Turbopack 下会报 Native module not found）。
 * Web Crypto 是异步 API，所以相关函数都是 async。
 */

const COOKIE_NAME = "cw_admin";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 天

function getPassword(): string | undefined {
  const value = process.env.ADMIN_PASSWORD;
  return value && value.trim().length > 0 ? value : undefined;
}

function getSecret(): string {
  // 用应用本身的密码作为 hash 盐之外的额外密钥；若未配 SECRET，退化为只用密码本身。
  return process.env.ADMIN_COOKIE_SECRET ?? "";
}

/** 把字符串编码为 Uint8Array（TextEncoder 在所有 runtime 都可用）。 */
function encode(input: string): Uint8Array {
  return new TextEncoder().encode(input);
}

/** 把 Uint8Array 转成 hex 字符串。 */
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** 用 Web Crypto 计算 sha256 hex。Edge Runtime / Node Runtime 都支持。 */
async function hashPassword(password: string): Promise<string> {
  const data = encode(password + getSecret());
  // TS 对 Uint8Array 泛型的定义与 crypto.subtle 期望的 BufferSource 不完全一致
  //（TS 5.7+ 起 Uint8Array 带 ArrayBufferLike 泛型），这里强制断言为 BufferSource。
  const digest = await crypto.subtle.digest(
    "SHA-256",
    data as BufferSource
  );
  return toHex(new Uint8Array(digest));
}

/** 后台是否已启用（ADMIN_PASSWORD 已配置）。未启用时不允许登录也不允许访问。 */
export function isAdminEnabled(): boolean {
  return getPassword() !== undefined;
}

/** 登录校验。成功则写入 httpOnly cookie 并返回 true，否则返回 false。 */
export async function signInWithPassword(password: string): Promise<boolean> {
  const configured = getPassword();
  if (!configured) return false;
  if (password !== configured) return false;

  const expiresAt = Date.now() + SESSION_TTL_MS;
  const token = `${await hashPassword(configured)}.${expiresAt}`;
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
  return true;
}

/** 销毁会话 cookie（登出）。 */
export async function signOut(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * 校验当前请求是否已登录管理员。供 server components / server actions 共用。
 * - cookie 缺失或格式错误 → false
 * - passwordHash 不匹配 → false
 * - 已过期 → false
 */
export async function isSignedIn(): Promise<boolean> {
  const configured = getPassword();
  if (!configured) return false;

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return isValidSessionToken(token);
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;

/**
 * 供 middleware.ts 使用的会话 token 校验。返回 true 表示有效会话。
 *
 * 异步原因：Web Crypto API（crypto.subtle.digest）是异步的，而本模块需要在
 * Edge Runtime（middleware）中运行，无法使用 node:crypto。
 *
 * 在 token 格式/过期时间的预检上保持同步快速失败，只有通过了预检才会真正算 hash。
 */
export async function isValidSessionToken(
  token: string | undefined
): Promise<boolean> {
  const configured = getPassword();
  if (!configured || !token) return false;

  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const hashPart = token.slice(0, dot);
  const expiresPart = token.slice(dot + 1);

  const expiresAt = Number(expiresPart);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;

  return hashPart === (await hashPassword(configured));
}
