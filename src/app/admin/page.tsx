import { Database, Library, PenLine, RefreshCw, Settings, Sparkles } from "lucide-react";
import Link from "next/link";
import { refreshDailyReportAction, rescoreAction, runAIHotFetch } from "@/app/admin/actions";
import { getTopicRadarData } from "@/lib/topic-radar/storage";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const data = await getTopicRadarData();
  const latestScores = data.hkrScores.slice(0, 20);

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
              <p className="text-xs text-[var(--muted)]">管理后台</p>
            </div>
          </div>
          <nav className="space-y-1">
            {[
              { label: "今日可写", href: "/", icon: Sparkles },
              { label: "选题库", href: "/topics", icon: Library },
              { label: "管理后台", href: "/admin", icon: Settings, active: true },
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
            <p className="mb-2 text-sm font-semibold text-[var(--green)]">数据源 / 拉取日志 / 评分结果</p>
            <h1 className="text-3xl font-semibold md:text-4xl">管理后台</h1>
          </header>

          <section className="mb-5 rounded-md border border-[var(--line)] bg-[var(--panel)]">
            <div className="border-b border-[var(--line)] px-5 py-4">
              <div className="flex items-center gap-2">
                <Database className="text-[var(--green)]" size={20} />
                <h2 className="text-lg font-semibold">手动拉取 AIHOT</h2>
              </div>
              <p className="text-sm text-[var(--muted)]">支持 selected / all / category / q / since。AIHOT 是测试版依赖，已在 client 层加入缓存、限流和错误兜底。</p>
            </div>
            <form action={runAIHotFetch} className="grid gap-4 p-5 md:grid-cols-5">
              <label>
                <span className="mb-2 block text-sm font-semibold">模式</span>
                <select className="h-10 w-full rounded-md border border-[var(--line)] bg-[#fbf8ec] px-3 text-sm" name="mode">
                  <option value="selected">selected</option>
                  <option value="all">all</option>
                </select>
              </label>
              <label>
                <span className="mb-2 block text-sm font-semibold">分类</span>
                <input className="h-10 w-full rounded-md border border-[var(--line)] bg-[#fbf8ec] px-3 text-sm" name="category" placeholder="ai-products" />
              </label>
              <label>
                <span className="mb-2 block text-sm font-semibold">关键词</span>
                <input className="h-10 w-full rounded-md border border-[var(--line)] bg-[#fbf8ec] px-3 text-sm" name="q" placeholder="OpenAI" />
              </label>
              <label>
                <span className="mb-2 block text-sm font-semibold">since</span>
                <input className="h-10 w-full rounded-md border border-[var(--line)] bg-[#fbf8ec] px-3 text-sm" name="since" placeholder="2026-06-05T00:00:00Z" />
              </label>
              <label>
                <span className="mb-2 block text-sm font-semibold">数量</span>
                <input className="h-10 w-full rounded-md border border-[var(--line)] bg-[#fbf8ec] px-3 text-sm" defaultValue="30" min="1" name="limit" type="number" />
              </label>
              <button className="h-10 rounded-md bg-[var(--green)] px-4 text-sm font-semibold text-white md:col-span-5">
                拉取并生成评分/选题卡
              </button>
            </form>
          </section>

          <section className="mb-5 rounded-md border border-[var(--line)] bg-[var(--panel)]">
            <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
              <h2 className="text-lg font-semibold">拉取日志</h2>
              <form action={refreshDailyReportAction}>
                <button className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--line)] px-3 text-sm font-semibold">
                  <RefreshCw size={15} />
                  生成日报
                </button>
              </form>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="border-b border-[var(--line)] text-[var(--muted)]">
                  <tr>
                    <th className="px-5 py-3 font-medium">时间</th>
                    <th className="px-5 py-3 font-medium">模式</th>
                    <th className="px-5 py-3 font-medium">状态</th>
                    <th className="px-5 py-3 font-medium">拉取</th>
                    <th className="px-5 py-3 font-medium">新增</th>
                    <th className="px-5 py-3 font-medium">去重</th>
                    <th className="px-5 py-3 font-medium">错误</th>
                  </tr>
                </thead>
                <tbody>
                  {data.fetchLogs.slice(0, 20).map((log) => (
                    <tr className="border-b border-[var(--line)] last:border-b-0" key={log.id}>
                      <td className="px-5 py-3 text-[var(--muted)]">{formatDate(log.finishedAt)}</td>
                      <td className="px-5 py-3">{log.mode}</td>
                      <td className="px-5 py-3">
                        <span className={`rounded-md px-2 py-1 text-xs ${log.status === "success" ? "bg-[#edf4ee] text-[var(--green)]" : "bg-[#fff6f2] text-[var(--red)]"}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">{log.fetchedCount}</td>
                      <td className="px-5 py-3">{log.insertedCount}</td>
                      <td className="px-5 py-3">{log.dedupedCount}</td>
                      <td className="max-w-[260px] px-5 py-3 text-xs text-[var(--red)]">{log.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-md border border-[var(--line)] bg-[var(--panel)]">
            <div className="border-b border-[var(--line)] px-5 py-4">
              <h2 className="text-lg font-semibold">评分结果</h2>
            </div>
            <div className="divide-y divide-[var(--line)]">
              {latestScores.map((score) => {
                const source = data.sourceItems.find((item) => item.id === score.sourceItemId);
                if (!source) return null;
                return (
                  <div className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between" key={score.id}>
                    <div>
                      <p className="font-semibold">{source.title}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        HKR {score.total} · H{score.h} / K{score.k} / R{score.r} · {score.level}
                      </p>
                    </div>
                    <form action={rescoreAction.bind(null, source.id)}>
                      <button className="inline-flex h-9 items-center rounded-md bg-[var(--ink)] px-3 text-sm font-semibold text-white">重新评分</button>
                    </form>
                  </div>
                );
              })}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
