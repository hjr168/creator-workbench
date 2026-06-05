import { BarChart3, Database, ExternalLink, Gauge, Library, PenLine, Settings, Sparkles } from "lucide-react";
import Link from "next/link";
import { runAIHotFetch } from "@/app/admin/actions";
import { HkrScoreDialog } from "@/app/hkr-score-dialog";
import { accountTypeOptions, scoreForAccount } from "@/lib/topic-radar/hkr";
import { getTopicRadarData, getTopicRadarItems } from "@/lib/topic-radar/storage";
import type { AccountType, TopicRadarItem } from "@/types/topic-radar";

export const dynamic = "force-dynamic";

const navItems = [
  { label: "今日可写", href: "/", icon: Sparkles, active: true },
  { label: "选题库", href: "/topics", icon: Library },
  { label: "HKR评分方法", href: "/hkr", icon: Gauge },
  { label: "管理后台", href: "/admin", icon: Settings },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ account?: string }>;
}) {
  const params = await searchParams;
  const account = accountTypeOptions.includes(params.account as AccountType)
    ? (params.account as AccountType)
    : "AI科普号";
  const data = await getTopicRadarData();
  const items = await getTopicRadarItems();
  const sortedItems = [...items]
    .sort((a, b) => scoreForAccount(b.score, account) - scoreForAccount(a.score, account))
    .slice(0, 8);
  const latestReport = data.dailyReports[0];

  return (
    <main className="min-h-screen px-5 py-5 text-[var(--foreground)] md:px-8">
      <div className="mx-auto flex w-full max-w-7xl gap-5">
        <Sidebar />
        <section className="min-w-0 flex-1">
          <header className="mb-5 flex flex-col gap-4 border-b border-[var(--line)] pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold text-[var(--green)]">AI 选题雷达 · MVP</p>
              <h1 className="max-w-3xl text-3xl font-semibold md:text-4xl">今日可写</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                从 AIHOT 拉取 AI 热点，去重入库后进行 HKR 评分，并生成公众号选题卡。
              </p>
            </div>
            <form action={runAIHotFetch}>
              <input name="mode" type="hidden" value="selected" />
              <input name="limit" type="hidden" value="30" />
              <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[var(--green)] px-4 text-sm font-semibold text-white">
                <Database size={18} />
                拉取 AIHOT 精选
              </button>
            </form>
          </header>

          <section className="mb-5 grid gap-3 md:grid-cols-4">
            <Stat label="入库内容" value={data.sourceItems.length} />
            <Stat label="选题卡" value={data.topicCards.length} />
            <Stat label="抓取日志" value={data.fetchLogs.length} />
            <Stat label="日报" value={data.dailyReports.length} />
          </section>

          <section className="mb-5 rounded-md border border-[var(--line)] bg-[var(--panel)] p-5">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold">今日高分选题</h2>
                <p className="text-sm text-[var(--muted)]">按账号类型重新加权排序，帮助判断今天最值得写什么。</p>
              </div>
              <form className="flex items-center gap-2">
                <select
                  className="h-10 rounded-md border border-[var(--line)] bg-[#fbf8ec] px-3 text-sm"
                  defaultValue={account}
                  name="account"
                >
                  {accountTypeOptions.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <button className="h-10 rounded-md bg-[var(--ink)] px-3 text-sm font-semibold text-white">筛选</button>
              </form>
            </div>

            {sortedItems.length ? (
              <div className="grid gap-3 xl:grid-cols-2">
                {sortedItems.map((item) => (
                  <TopicCardPreview account={account} item={item} key={item.card.id} />
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-[var(--line)] bg-[#fbf8ec] p-8 text-center text-sm text-[var(--muted)]">
                暂无选题数据。先点击右上角拉取 AIHOT 精选。
              </div>
            )}
          </section>

          {latestReport ? (
            <section className="rounded-md border border-[var(--line)] bg-[var(--panel)] p-5">
              <div className="mb-3 flex items-center gap-2">
                <BarChart3 className="text-[var(--blue)]" size={20} />
                <h2 className="text-lg font-semibold">今日 Markdown 日报</h2>
              </div>
              <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-md bg-[var(--ink)] p-4 text-xs leading-6 text-[var(--panel)]">
                {latestReport.markdown}
              </pre>
            </section>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-[var(--line)] pr-5 lg:block">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-md bg-[var(--ink)] text-[var(--panel)]">
          <PenLine size={20} />
        </div>
        <div>
          <p className="text-sm font-semibold">今日可写</p>
          <p className="text-xs text-[var(--muted)]">公众号 AI 选题雷达</p>
        </div>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => (
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
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-[var(--line)] bg-[var(--panel)] p-4">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-[var(--green)]">{value}</p>
    </div>
  );
}

function TopicCardPreview({ item, account }: { item: TopicRadarItem; account: AccountType }) {
  return (
    <article className="rounded-md border border-[var(--line)] bg-[#fbf8ec] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="rounded-md bg-white px-2 py-1 text-xs text-[var(--green)]">{item.score.level}</span>
        <HkrScoreDialog account={account} compact score={item.score} />
      </div>
      <h3 className="line-clamp-2 text-lg font-semibold leading-snug">{item.card.title}</h3>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--muted)]">{item.card.oneLineSummary}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
        <span>{item.source.sourceName}</span>
        <span>{formatDate(item.source.publishedAt)}</span>
        <a className="inline-flex items-center gap-1 text-[var(--green)]" href={item.source.url} rel="noreferrer" target="_blank">
          原文 <ExternalLink size={12} />
        </a>
      </div>
      <Link className="mt-4 inline-flex h-9 items-center rounded-md bg-[var(--ink)] px-3 text-sm font-semibold text-white" href={`/topics/${item.card.id}`}>
        查看选题卡
      </Link>
    </article>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
