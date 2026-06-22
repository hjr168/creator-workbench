"use server";

import { redirect } from "next/navigation";
import { signInWithPassword } from "@/lib/auth/admin-session";

export type LoginState = { error?: string } | undefined;

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  const ok = await signInWithPassword(password);
  if (!ok) {
    return { error: "密码错误，或后台尚未启用。" };
  }
  redirect("/admin");
}
