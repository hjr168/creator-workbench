import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findTopicRadarItem } from "@/lib/topic-radar/storage";
import { SiteSidebar } from "@/app/_components/site-sidebar";
import { CopyTopicActions } from "./copy-topic-actions";

export const dynamic = "force-dynamic";

export default async function TopicDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await findTopicRadarItem(id);
  if (!item) notFound();

  return (
    <main className="min-h-screen px-5 py-5 text-[var(--foreground)] md:px-8">
      <div className="mx-auto flex w-full max-w-7xl gap-5">
        <SiteSidebar activeHref="/topics" />

        <article className="min-w-0 flex-1">
          <header className="mb-5 border-b border-[var(--line)] pb-5">
            <Link className="mb-3 inline-flex text-sm text-[var(--green)] hover:underline" href="/topics">
              返回选题库
            </Link>
            <p className="mb-2 text-sm font-semibold text-[var(--green)]">{item.score.level} · HKR {item.score.total}</p>
            <h1 className="max-w-4xl text-3xl font-semibold leading-tight md:text-4xl">{item.card.title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">{item.card.oneLineSummary}</p>
          </header>

          <div className="mb-5 rounded-md border border-[var(--red)] bg-[#fff6f2] p-4 text-sm leading-6 text-[var(--red)]">
            正式写作前请打开原文链接核对事实、发布时间、数据和上下文；本页选题卡是二次分析，不应直接复制上游摘要。
          </div>

          <div className="mb-5">
            <CopyTopicActions item={item} />
          </div>

          <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-5">
              <Block title="原始事件">
                <dl className="grid gap-3 text-sm">
                  <Row label="来源" value={item.source.sourceName} />
                  <Row label="发布时间" value={formatDate(item.source.publishedAt)} />
                  <Row label="分类" value={item.source.category ?? "未分类"} />
                  <div>
                    <dt className="mb-1 text-[var(--muted)]">原文链接</dt>
                    <dd>
                      <a className="inline-flex items-center gap-1 text-[var(--green)] hover:underline" href={item.source.url} rel="noreferrer" target="_blank">
                        打开原文 <ExternalLink size={14} />
                      </a>
                    </dd>
                  </div>
                </dl>
              </Block>

              <Block title="为什么值得写">
                <p className="text-sm leading-7">{item.card.whyWorthWriting}</p>
              </Block>

              <Block title="推荐标题">
                <List items={item.card.recommendedTitles} />
              </Block>

              <Block title="文章大纲">
                <List items={item.card.outline} />
              </Block>
            </div>

            <div className="space-y-5">
              <Block title="HKR 评分解释">
                <div className="grid gap-3 text-sm">
                  <Score label="H 热点势能" value={item.score.h} reason={item.score.reasons.h} />
                  <Score label="K 知识增量" value={item.score.k} reason={item.score.reasons.k} />
                  <Score label="R 阅读传播潜力" value={item.score.r} reason={item.score.reasons.r} />
                </div>
              </Block>

              <Block title="适合账号与写法">
                <div className="flex flex-wrap gap-2">
                  {item.card.suitableAccounts.map((account) => (
                    <span className="rounded-md bg-[#edf4ee] px-2.5 py-1 text-sm text-[var(--green)]" key={account}>
                      {account}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-sm">推荐写法：{item.card.recommendedApproach}</p>
                <p className="mt-2 text-sm">预计难度：{item.card.difficulty}</p>
              </Block>

              <Block title="推荐角度">
                <List items={item.card.writingAngles} />
              </Block>

              <Block title="可引用事实">
                <List items={item.card.factsToVerify} />
              </Block>

              <Block title="可延展观点">
                <List items={item.card.extendableViews} />
              </Block>

              <Block title="风险提示">
                <List items={item.card.risks} />
              </Block>
            </div>
          </section>
        </article>
      </div>
    </main>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-[var(--line)] bg-[var(--panel)] p-5">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm leading-6">
      {items.map((item) => (
        <li className="rounded-md bg-[#fbf8ec] px-3 py-2" key={item}>
          {item}
        </li>
      ))}
    </ul>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="mb-1 text-[var(--muted)]">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Score({ label, value, reason }: { label: string; value: number; reason: string }) {
  return (
    <div className="rounded-md bg-[#fbf8ec] p-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-semibold">{label}</span>
        <span className="text-[var(--blue)]">{value}</span>
      </div>
      <p className="text-xs leading-5 text-[var(--muted)]">{reason}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
