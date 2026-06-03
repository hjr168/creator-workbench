import {
  BarChart3,
  ClipboardList,
  Library,
  MessageSquareText,
  PenLine,
  Play,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { findTopicById, getWorkbenchData } from "@/lib/storage/local-json";

const navItems = [
  { label: "首页", href: "/", icon: ClipboardList },
  { label: "创作对话", href: "/creation", icon: MessageSquareText },
  { label: "选题库", href: "/topics", icon: Library },
  { label: "工具调用", href: "/tools", icon: Play },
  { label: "数据复盘", href: "/review", icon: RefreshCw, active: true },
];

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const data = await getWorkbenchData();
  const totalReads = data.publishRecords.reduce((sum, record) => sum + (record.reads ?? 0), 0);
  const totalLikes = data.publishRecords.reduce((sum, record) => sum + (record.likes ?? 0), 0);
  const totalFavorites = data.publishRecords.reduce((sum, record) => sum + (record.favorites ?? 0), 0);
  const bestRecord = data.publishRecords.toSorted((a, b) => (b.reads ?? 0) - (a.reads ?? 0))[0];
  const bestTopic = bestRecord ? findTopicById(data, bestRecord.topicId) : undefined;

  return (
    <main className="min-h-screen px-5 py-5 text-[var(--foreground)] md:px-8">
      <div className="mx-auto flex w-full max-w-7xl gap-5">
        <aside className="hidden w-60 shrink-0 border-r border-[var(--line)] pr-5 lg:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-md bg-[var(--ink)] text-[var(--panel)]">
              <PenLine size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold">个人IP内容工作台</p>
              <p className="text-xs text-[var(--muted)]">数据复盘</p>
            </div>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                className={`flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm transition ${
                  item.active
                    ? "bg-[var(--ink)] text-[var(--panel)]"
                    : "text-[var(--muted)] hover:bg-[var(--panel-strong)] hover:text-[var(--foreground)]"
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
            <p className="mb-2 text-sm font-semibold text-[var(--green)]">MVP · 发布复盘</p>
            <h1 className="max-w-3xl text-3xl font-semibold md:text-4xl">把发布数据变成下一轮选题判断。</h1>
          </header>

          <section className="mb-5 grid gap-3 md:grid-cols-4">
            <Metric label="发布记录" value={data.publishRecords.length} />
            <Metric label="总阅读" value={totalReads} />
            <Metric label="总点赞" value={totalLikes} />
            <Metric label="总收藏" value={totalFavorites} />
          </section>

          <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-md border border-[var(--line)] bg-[var(--panel)] p-5">
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp className="text-[var(--gold)]" size={20} />
                <h2 className="text-lg font-semibold">表现最好内容</h2>
              </div>
              {bestRecord && bestTopic ? (
                <div className="rounded-md border border-[var(--line)] bg-[#fbf8ec] p-4">
                  <p className="text-sm text-[var(--muted)]">{bestRecord.platform}</p>
                  <h3 className="mt-2 text-xl font-semibold leading-snug">{bestTopic.title}</h3>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <span>阅读 {bestRecord.reads ?? 0}</span>
                    <span>点赞 {bestRecord.likes ?? 0}</span>
                    <span>收藏 {bestRecord.favorites ?? 0}</span>
                    <span>评论 {bestRecord.comments ?? 0}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--muted)]">暂无发布数据。</p>
              )}
            </div>

            <div className="rounded-md border border-[var(--line)] bg-[var(--panel)] p-5">
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 className="text-[var(--blue)]" size={20} />
                <h2 className="text-lg font-semibold">复盘记录</h2>
              </div>
              <div className="space-y-4">
                {data.reviewRecords.map((record) => {
                  const topic = findTopicById(data, record.topicId);
                  return (
                    <article className="rounded-md border border-[var(--line)] bg-[#fbf8ec] p-4" key={record.id}>
                      <p className="text-sm font-semibold">{topic?.title ?? "未命名选题"}</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{record.summary}</p>
                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <ReviewList title="有效信号" items={record.goodSignals} />
                        <ReviewList title="薄弱信号" items={record.weakSignals} />
                        <ReviewList title="下一步" items={record.nextActions} />
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-[var(--line)] bg-[var(--panel)] p-4">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-[var(--green)]">{value}</p>
    </div>
  );
}

function ReviewList({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <p className="mb-2 text-sm font-semibold">{title}</p>
      <ul className="space-y-1 text-sm leading-5 text-[var(--muted)]">
        {items.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </section>
  );
}

