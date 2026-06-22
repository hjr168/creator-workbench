import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { HkrScoreDialog } from "@/app/hkr-score-dialog";
import { MarkdownDailyReport } from "@/app/markdown-daily-report";
import { SiteSidebar } from "@/app/_components/site-sidebar";
import { AccountTypeMemory } from "@/app/_components/account-type-memory";
import { accountTypeOptions, scoreForAccount } from "@/lib/topic-radar/hkr";
import { formatUpdatedAt, getLatestDataUpdatedAt } from "@/lib/topic-radar/metadata";
import { getTopicRadarData, getTopicRadarItems } from "@/lib/topic-radar/storage";
import type { AccountType, TopicRadarItem } from "@/types/topic-radar";

export const dynamic = "force-dynamic";

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
  const updatedAt = getLatestDataUpdatedAt(data);

  const strongCount = items.filter((item) => item.score.level === "强烈推荐").length;
  const hotCount = items.filter((item) => item.score.level === "适合追热点").length;

  const sortedItems = [...items]
    .sort((a, b) => scoreForAccount(b.score, account) - scoreForAccount(a.score, account))
    .slice(0, 8);
  const latestReport = data.dailyReports[0];

  return (
    <main className="min-h-screen px-5 py-5 text-[var(--foreground)] md:px-8">
      <AccountTypeMemory currentAccount={account} />
      <div className="mx-auto flex w-full max-w-7xl gap-5">
        <SiteSidebar activeHref="/" />
        <section className="min-w-0 flex-1">
          {/* Hero */}
          <header className="mb-5 border-b border-[var(--line)] pb-5">
            <p className="mb-2 text-sm font-semibold text-[var(--green)]">AI 选题雷达 · MVP</p>
            <h1 className="max-w-3xl text-3xl font-semibold md:text-4xl">今日可写</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              每天帮你判断：今天 AI 圈什么最值得写、为什么值得写、怎么写。
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              基于公开 AI 热点进行 HKR 评分，按不同账号类型重排，输出标题、角度和文章大纲。
            </p>
          </header>

          {/* 信息条 */}
          <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="数据更新时间" value={formatUpdatedAt(updatedAt)} />
            <Stat label="当前选题池" value={`${items.length} 条`} />
            <Stat label="强烈推荐" value={`${strongCount} 条`} />
            <Stat label="适合追热点" value={`${hotCount} 条`} />
          </section>

          {/* 今日最值得写 */}
          <section className="mb-5 rounded-md border border-[var(--line)] bg-[var(--panel)] p-5">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold">今日最值得写</h2>
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
                暂无选题数据。稍后在每日更新后会出现今天的选题。
              </div>
            )}

            <p className="mt-4 rounded-md bg-[#fff6f2] px-3 py-2 text-xs leading-5 text-[var(--red)]">
              本页内容由系统基于公开来源二次分析生成，正式写作前请回源核对事实、时间和上下文。
            </p>
          </section>

          {latestReport ? <MarkdownDailyReport markdown={latestReport.markdown} /> : null}
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--line)] bg-[var(--panel)] p-4">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-xl font-semibold text-[var(--green)] md:text-2xl">{value}</p>
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
