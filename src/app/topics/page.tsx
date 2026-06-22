import type { Metadata } from "next";
import { accountTypeOptions, scoreForAccount } from "@/lib/topic-radar/hkr";
import { getTopicRadarData, getTopicRadarItems } from "@/lib/topic-radar/storage";
import { formatUpdatedAt, getLatestDataUpdatedAt } from "@/lib/topic-radar/metadata";
import { SiteSidebar } from "@/app/_components/site-sidebar";
import { AccountTypeMemory } from "@/app/_components/account-type-memory";
import type { AccountType, TopicRadarItem } from "@/types/topic-radar";
import { TopicCardList } from "./topic-card-list";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "选题库 - 今日可写",
  description: "AI 选题库，按账号类型和推荐级别筛选，支持关键词搜索，找到今天值得写的选题。",
};

export default async function TopicsPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string; level?: string; q?: string }>;
}) {
  const params = await searchParams;
  const account = accountTypeOptions.includes(params.account as AccountType)
    ? (params.account as AccountType)
    : "AI科普号";
  const level = String(params.level ?? "全部");
  const q = String(params.q ?? "").trim();
  const needle = q ? q.toLowerCase() : "";

  const data = await getTopicRadarData();
  const updatedAt = getLatestDataUpdatedAt(data);
  const items = (await getTopicRadarItems())
    .filter((item) => level === "全部" || item.score.level === level)
    .filter((item) => (needle ? matchesKeyword(item, needle) : true))
    .sort((a, b) => scoreForAccount(b.score, account) - scoreForAccount(a.score, account));

  return (
    <main className="min-h-screen px-5 py-5 text-[var(--foreground)] md:px-8">
      <AccountTypeMemory currentAccount={account} />
      <div className="mx-auto flex w-full max-w-7xl gap-5">
        <SiteSidebar activeHref="/topics" />

        <section className="min-w-0 flex-1">
          <header className="mb-5 border-b border-[var(--line)] pb-5">
            <p className="mb-2 text-sm font-semibold text-[var(--green)]">AIHOT / RSS 标准化选题池</p>
            <h1 className="text-3xl font-semibold md:text-4xl">选题列表</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">数据更新时间：{formatUpdatedAt(updatedAt)}</p>
          </header>

          <form className="mb-5 flex flex-col gap-3 rounded-md border border-[var(--line)] bg-[var(--panel)] p-4 md:flex-row md:items-end md:flex-wrap">
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
            <label className="block flex-1 min-w-[180px]">
              <span className="mb-2 block text-sm font-semibold">关键词</span>
              <input
                className="h-10 w-full rounded-md border border-[var(--line)] bg-[#fbf8ec] px-3 text-sm"
                defaultValue={q}
                name="q"
                placeholder="搜索标题 / 摘要 / 角度 / 来源"
                type="search"
              />
            </label>
            <button className="h-10 rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white">筛选</button>
          </form>

          {items.length ? (
            <TopicCardList account={account} items={items} key={`${account}-${level}-${q}-${items.length}`} />
          ) : (
            <div className="rounded-md border border-dashed border-[var(--line)] bg-[var(--panel)] p-8 text-center text-sm text-[var(--muted)]">
              没有找到符合条件的选题，可以尝试更换关键词、账号类型或推荐级别。
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

/** 关键词大小写不敏感搜索，覆盖卡片主体字段与来源字段。 */
function matchesKeyword(item: TopicRadarItem, needle: string): boolean {
  const haystack = [
    item.card.title,
    item.card.oneLineSummary,
    item.card.whyWorthWriting,
    item.card.recommendedApproach,
    ...item.card.writingAngles,
    ...item.card.recommendedTitles,
    ...item.card.outline,
    ...item.card.suitableAccounts,
    ...item.card.risks,
    item.source.sourceName,
    item.source.category,
    item.source.provider,
  ]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();
  return haystack.includes(needle);
}
