"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { AccountType } from "@/types/topic-radar";

const STORAGE_KEY = "creator-workbench:account-type";
const DEFAULT_ACCOUNT: AccountType = "AI科普号";

const VALID_ACCOUNTS: AccountType[] = [
  "AI科普号",
  "产品经理/SaaS号",
  "职场效率号",
  "创业商业号",
  "技术开发者号",
];

function isValidAccount(value: string | null): value is AccountType {
  return value !== null && (VALID_ACCOUNTS as string[]).includes(value);
}

/**
 * 记住用户选择的账号类型。
 *
 * - URL 中有 account 参数：以其为准，写入 localStorage。
 * - URL 中没有 account 参数：读取 localStorage，若存在合法值则跳转补上 ?account=xxx（保留 level/q）。
 * - 都没有则用默认值，不跳转。
 *
 * 仅在客户端运行，SSR 阶段不输出任何内容，不影响服务端渲染。
 */
export function AccountTypeMemory({ currentAccount }: { currentAccount: AccountType }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const urlAccount = searchParams.get("account");

    if (urlAccount && isValidAccount(urlAccount)) {
      // URL 已指定：以 URL 为准，写入 localStorage。
      try {
        localStorage.setItem(STORAGE_KEY, urlAccount);
      } catch {
        // localStorage 不可用（隐私模式等）时静默跳过，不影响功能。
      }
      return;
    }

    // URL 没有 account：尝试从 localStorage 补全。
    let remembered: string | null = null;
    try {
      remembered = localStorage.getItem(STORAGE_KEY);
    } catch {
      remembered = null;
    }

    if (isValidAccount(remembered) && remembered !== DEFAULT_ACCOUNT) {
      // 复制现有 query，补上 account，避免覆盖 level / q。
      const params = new URLSearchParams(searchParams.toString());
      params.set("account", remembered);
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [router, pathname, searchParams, currentAccount]);

  // 该组件不渲染可见 UI。
  return null;
}
