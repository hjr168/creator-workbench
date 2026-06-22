import { cookies } from "next/headers";
import { createHash } from "node:crypto";

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

function hashPassword(password: string): string {
  return createHash("sha256").update(password + getSecret()).digest("hex");
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
  const token = `${hashPassword(configured)}.${expiresAt}`;
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
 * 供 middleware.ts 使用的同步校验（middleware 里 next/headers 的 cookies() 行为受限，
 * 改用 request 的 cookie 值直接校验）。返回 true 表示有效会话。
 */
export function isValidSessionToken(token: string | undefined): boolean {
  const configured = getPassword();
  if (!configured || !token) return false;

  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const hashPart = token.slice(0, dot);
  const expiresPart = token.slice(dot + 1);

  const expiresAt = Number(expiresPart);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;

  return hashPart === hashPassword(configured);
}
