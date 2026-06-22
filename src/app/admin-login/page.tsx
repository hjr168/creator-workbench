"use client";

import { useActionState } from "react";
import Link from "next/link";
import { PenLine } from "lucide-react";
import { loginAction, type LoginState } from "./actions";

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, undefined);

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10 text-[var(--foreground)]">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-md bg-[var(--ink)] text-[var(--panel)]">
            <PenLine size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold">今日可写</p>
            <p className="text-xs text-[var(--muted)]">管理后台登录</p>
          </div>
        </div>

        <form action={formAction} className="space-y-4 rounded-md border border-[var(--line)] bg-[var(--panel)] p-6">
          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="password">
              管理员密码
            </label>
            <input
              autoComplete="current-password"
              className="h-11 w-full rounded-md border border-[var(--line)] bg-[#fbf8ec] px-3 text-sm"
              id="password"
              name="password"
              type="password"
              required
            />
          </div>

          {state?.error ? (
            <p className="rounded-md bg-[#fff6f2] px-3 py-2 text-sm text-[var(--red)]">{state.error}</p>
          ) : null}

          <button
            className="h-11 w-full rounded-md bg-[var(--green)] px-4 text-sm font-semibold text-white disabled:opacity-60"
            disabled={pending}
            type="submit"
          >
            {pending ? "登录中…" : "登录"}
          </button>

          <p className="text-center text-xs leading-5 text-[var(--muted)]">
            管理后台仅限授权访问。普通用户请返回
            <Link className="text-[var(--green)] hover:underline" href="/">
              今日可写
            </Link>
            。
          </p>
        </form>
      </div>
    </main>
  );
}
