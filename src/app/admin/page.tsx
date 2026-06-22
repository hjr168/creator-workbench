import { Bot, Database, Gauge, Library, PenLine, RefreshCw, Settings, Sparkles } from "lucide-react";
import Link from "next/link";
import { refreshDailyReportAction, rescoreAction, runAIHotFetch } from "@/app/admin/actions";
import { logoutAction } from "@/app/admin/logout-action";
import { getTopicRadarData } from "@/lib/topic-radar/storage";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const data = await getTopicRadarData();
  const latestScores = data.hkrScores.slice(0, 20);
  const llmEnabled = Boolean(process.env.OPENAI_API_KEY);
  const llmModel = process.env.TOPIC_RADAR_LLM_MODEL ?? "gpt-4o-mini";
  const llmCards = data.topicCards.filter((card) => card.generatedBy === "llm");
  const heuristicCards = data.topicCards.filter((card) => card.generatedBy === "heuristic");
  const latestLlmCard = llmCards
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

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
              { label: "HKR评分方法", href: "/hkr", icon: Gauge },
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
          <header className="mb-5 flex items-end justify-between border-b border-[var(--line)] pb-5">
            <div>
              <p className="mb-2 text-sm font-semibold text-[var(--green)]">数据源 / 拉取日志 / 评分结果</p>
              <h1 className="text-3xl font-semibold md:text-4xl">管理后台</h1>
            </div>
            <form action={logoutAction}>
              <button className="inline-flex h-9 items-center rounded-md border border-[var(--line)] px-3 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--panel-strong)]" type="submit">
                退出登录
              </button>
            </form>
          </header>

          <section className="mb-5 rounded-md border border-[var(--line)] bg-[var(--panel)]">
            <div className="border-b border-[var(--line)] px-5 py-4">
              <div className="flex items-center gap-2">
                <Bot className="text-[var(--blue)]" size={20} />
                <h2 className="text-lg font-semibold">生成模型状态</h2>
              </div>
              <p className="text-sm text-[var(--muted)]">用于判断选题卡生成当前是否启用大模型，以及历史选题卡的生成来源。</p>
            </div>
            <div className="grid gap-3 p-5 lg:grid-cols-4">
              <StatusCell
                label="当前状态"
                tone={llmEnabled ? "green" : "gold"}
                value={llmEnabled ? "已启用大模型" : "未启用大模型"}
              />
              <StatusCell label="模型" value={llmEnabled ? llmModel : "本地启发式规则"} />
              <StatusCell label="LLM 生成" value={`${llmCards.length} 张`} />
              <StatusCell label="规则兜底" value={`${heuristicCards.length} 张`} />
            </div>
            <div className="border-t border-[var(--line)] px-5 py-4 text-sm leading-6 text-[var(--muted)]">
              {llmEnabled ? (
                <p>
                  已检测到 `OPENAI_API_KEY`，后续拉取或重新评分时会优先调用 OpenAI Chat Completions，模型为
                  {" "}{llmModel}，要求返回 JSON 结构化选题卡；如果接口失败、超时或返回异常，会自动回退到本地启发式生成器。
                  {latestLlmCard ? ` 最近一次 LLM 生成时间：${formatDate(latestLlmCard.createdAt)}。` : " 当前还没有历史选题卡标记为 LLM 生成。"}
                </p>
              ) : (
                <p>
                  当前未配置 `OPENAI_API_KEY`，系统会使用本地启发式规则生成选题卡。配置 `.env.local` 后重启 dev server，新拉取或手动重新评分的选题会优先尝试大模型生成。
                </p>
              )}
            </div>
          </section>

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

function StatusCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "green" | "gold";
}) {
  const toneClass = tone === "green" ? "text-[var(--green)]" : tone === "gold" ? "text-[var(--gold)]" : "text-[var(--foreground)]";
  return (
    <div className="rounded-md border border-[var(--line)] bg-[#fbf8ec] p-4">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className={`mt-2 text-xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}
