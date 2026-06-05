import { Gauge, Library, PenLine, Settings, Sparkles } from "lucide-react";
import Link from "next/link";
import { accountTypeOptions, scoreForAccount } from "@/lib/topic-radar/hkr";
import { getTopicRadarItems } from "@/lib/topic-radar/storage";
import type { AccountType } from "@/types/topic-radar";
import { TopicCardList } from "./topic-card-list";

export const dynamic = "force-dynamic";

export default async function TopicsPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string; level?: string }>;
}) {
  const params = await searchParams;
  const account = accountTypeOptions.includes(params.account as AccountType)
    ? (params.account as AccountType)
    : "AI科普号";
  const level = String(params.level ?? "全部");
  const items = (await getTopicRadarItems())
    .filter((item) => level === "全部" || item.score.level === level)
    .sort((a, b) => scoreForAccount(b.score, account) - scoreForAccount(a.score, account));

  return (
    <main className="min-h-screen px-5 py-5 text-[var(--foreground)] md:px-8">
      <div className="mx-auto flex w-full max-w-7xl gap-5">
        <aside className="hidden w-60 shrink-0 border-r border-[var(--line)] pr-5 lg:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-md bg-[var(--ink)] text-[var(--panel)]">
              <PenLine size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold">今日可写</p>
              <p className="text-xs text-[var(--muted)]">选题库</p>
            </div>
          </div>
          <nav className="space-y-1">
            {[
              { label: "今日可写", href: "/", icon: Sparkles },
              { label: "选题库", href: "/topics", icon: Library, active: true },
              { label: "HKR评分方法", href: "/hkr", icon: Gauge },
              { label: "管理后台", href: "/admin", icon: Settings },
            ].map((item) => (
              <Link
                className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm ${
                  item.active ? "bg-[var(--ink)] text-[var(--panel)]" : "text-[var(--muted)] hover:bg-[var(--panel-strong)]"
                }`}
                href={item.href}
                key={item.label}
              >
                <item.icon size={17} />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="mb-5 border-b border-[var(--line)] pb-5">
            <p className="mb-2 text-sm font-semibold text-[var(--green)]">AIHOT / RSS 标准化选题池</p>
            <h1 className="text-3xl font-semibold md:text-4xl">选题列表</h1>
          </header>

          <form className="mb-5 flex flex-col gap-3 rounded-md border border-[var(--line)] bg-[var(--panel)] p-4 md:flex-row md:items-end">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">账号类型</span>
              <select className="h-10 rounded-md border border-[var(--line)] bg-[#fbf8ec] px-3 text-sm" defaultValue={account} name="account">
                {accountTypeOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">推荐级别</span>
              <select className="h-10 rounded-md border border-[var(--line)] bg-[#fbf8ec] px-3 text-sm" defaultValue={level} name="level">
                {["全部", "强烈推荐", "适合追热点", "适合写深度", "可关注", "暂不建议"].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <button className="h-10 rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white">筛选</button>
          </form>

          <TopicCardList account={account} items={items} key={`${account}-${level}-${items.length}`} />
        </section>
      </div>
    </main>
  );
}
