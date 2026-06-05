import { ExternalLink, Gauge, Library, PenLine, Settings, Sparkles } from "lucide-react";
import Link from "next/link";
import { accountTypeOptions, scoreForAccount } from "@/lib/topic-radar/hkr";
import { getTopicRadarItems } from "@/lib/topic-radar/storage";
import type { AccountType, RecommendationLevel } from "@/types/topic-radar";

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

          <section className="rounded-md border border-[var(--line)] bg-[var(--panel)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                <thead className="border-b border-[var(--line)] text-[var(--muted)]">
                  <tr>
                    <th className="px-5 py-3 font-medium">选题</th>
                    <th className="px-5 py-3 font-medium">来源</th>
                    <th className="px-5 py-3 font-medium">发布时间</th>
                    <th className="px-5 py-3 font-medium">HKR</th>
                    <th className="px-5 py-3 font-medium">适合账号</th>
                    <th className="px-5 py-3 font-medium">推荐写法</th>
                    <th className="px-5 py-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr className="border-b border-[var(--line)] last:border-b-0" key={item.card.id}>
                      <td className="max-w-[320px] px-5 py-4">
                        <p className="font-semibold leading-6">{item.card.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--muted)]">{item.card.oneLineSummary}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div>{item.source.sourceName}</div>
                        <a className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--green)]" href={item.source.url} rel="noreferrer" target="_blank">
                          原文 <ExternalLink size={12} />
                        </a>
                      </td>
                      <td className="px-5 py-4 text-[var(--muted)]">{formatDate(item.source.publishedAt)}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 font-semibold text-[var(--blue)]">
                          <Gauge size={15} />
                          {scoreForAccount(item.score, account)}
                        </span>
                        <div className="mt-1 text-xs text-[var(--muted)]">
                          H{item.score.h} / K{item.score.k} / R{item.score.r}
                        </div>
                        <div className="mt-1 w-fit rounded-md bg-[#edf4ee] px-2 py-1 text-xs text-[var(--green)]">
                          {item.score.level as RecommendationLevel}
                        </div>
                      </td>
                      <td className="max-w-[180px] px-5 py-4 text-[var(--muted)]">{item.card.suitableAccounts.join("、")}</td>
                      <td className="px-5 py-4">{item.card.recommendedApproach}</td>
                      <td className="px-5 py-4">
                        <Link className="inline-flex h-9 items-center rounded-md bg-[var(--green)] px-3 text-sm font-semibold text-white" href={`/topics/${item.card.id}`}>
                          详情
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!items.length ? <div className="p-8 text-center text-sm text-[var(--muted)]">暂无符合条件的选题。</div> : null}
          </section>
        </section>
      </div>
    </main>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
