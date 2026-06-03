import {
  ArrowRight,
  BookOpenText,
  CheckCircle2,
  ClipboardList,
  FileText,
  Library,
  MessageSquareText,
  PenLine,
  Play,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  getActiveCreationSession,
  getDashboardStats,
  getWorkbenchData,
} from "@/lib/storage/local-json";

const navItems = [
  { label: "首页", href: "/", icon: ClipboardList, active: true },
  { label: "创作对话", href: "/creation", icon: MessageSquareText },
  { label: "选题库", href: "/topics", icon: Library },
  { label: "工具调用", href: "/tools", icon: Play },
  { label: "数据复盘", href: "/review", icon: RefreshCw },
];

export const dynamic = "force-dynamic";

export default async function Home() {
  const workbenchData = await getWorkbenchData();
  const topics = workbenchData.topics;
  const toolRuns = workbenchData.toolRuns;
  const activeSession = getActiveCreationSession(workbenchData);
  const activeTopic = activeSession?.topicSnapshot;
  const dashboardStats = getDashboardStats(workbenchData);
  const stats = [
    { label: "总选题", value: dashboardStats.totalTopics, tone: "green" },
    { label: "待创作", value: dashboardStats.pendingCreation, tone: "blue" },
    { label: "已发布", value: dashboardStats.published, tone: "gold" },
    { label: "待确认", value: dashboardStats.pendingConfirmation, tone: "red" },
  ];

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
              <p className="text-xs text-[var(--muted)]">本地创作编排</p>
            </div>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                className={`flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm transition ${
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
          <header className="mb-5 flex flex-col gap-4 border-b border-[var(--line)] pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold text-[var(--green)]">MVP · 本地内容工作台</p>
              <h1 className="max-w-3xl text-3xl font-semibold tracking-normal md:text-4xl">
                先确认选题和大纲，再调用工具生成推文。
              </h1>
            </div>
            <Link
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[var(--green)] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#275d45]"
              href="/creation"
            >
              <MessageSquareText size={18} />
              开始创作对话
            </Link>
          </header>

          <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <div className="rounded-md border border-[var(--line)] bg-[var(--panel)] p-4" key={stat.label}>
                <p className="text-sm text-[var(--muted)]">{stat.label}</p>
                <p className={`mt-2 text-3xl font-semibold ${toneClass(stat.tone)}`}>{stat.value}</p>
              </div>
            ))}
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.35fr_0.85fr]">
            <div className="rounded-md border border-[var(--line)] bg-[var(--panel)]">
              <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
                <div>
                  <h2 className="text-lg font-semibold">当前创作流</h2>
                  <p className="text-sm text-[var(--muted)]">关键节点必须确认后才能进入生成。</p>
                </div>
                <span className="rounded-md bg-[#f4ead0] px-3 py-1 text-sm font-medium text-[var(--gold)]">
                  {activeSession?.currentStep ?? "暂无创作流"}
                </span>
              </div>

              <div className="p-5">
                {activeTopic && activeSession ? (
                  <div>
                    <div className="mb-5">
                      <p className="mb-2 text-sm text-[var(--muted)]">当前选题</p>
                      <h3 className="text-2xl font-semibold leading-snug">{activeTopic.title}</h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {[activeTopic.direction, activeSession.targetPlatform, activeSession.targetContentType, activeSession.confirmedAngle]
                          .filter(Boolean)
                          .map((item) => (
                            <span className="rounded-md border border-[var(--line)] px-2.5 py-1 text-sm text-[var(--muted)]" key={item}>
                              {item}
                            </span>
                          ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {activeSession.decisions.map((decision, index) => (
                        <div className="flex gap-3 rounded-md border border-[var(--line)] bg-[#fbf8ec] p-4" key={decision.id}>
                          <div className="grid size-8 shrink-0 place-items-center rounded-md bg-[var(--panel-strong)] text-sm font-semibold">
                            {index + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                              <p className="font-medium">{decision.step}</p>
                              <span className={`w-fit rounded-md px-2.5 py-1 text-xs font-semibold ${statusClass(decision.status)}`}>
                                {decision.status}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-[var(--muted)]">{decision.question}</p>
                            {decision.answer ? <p className="mt-2 text-sm">{decision.answer}</p> : null}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 flex flex-col gap-3 border-t border-[var(--line)] pt-5 sm:flex-row">
                      <Link
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white"
                        href="/creation"
                      >
                        <CheckCircle2 size={17} />
                        进入创作对话
                      </Link>
                      <Link
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-transparent px-4 text-sm font-semibold"
                        href="/topics"
                      >
                        <Sparkles size={17} />
                        查看选题库
                      </Link>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-md border border-[var(--line)] bg-[var(--panel)] p-5">
                <div className="mb-4 flex items-center gap-2">
                  <BookOpenText className="text-[var(--blue)]" size={20} />
                  <h2 className="text-lg font-semibold">待处理选题</h2>
                </div>
                <div className="space-y-3">
                  {topics.map((topic) => (
                    <div className="rounded-md border border-[var(--line)] bg-[#fbf8ec] p-3" key={topic.id}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="line-clamp-2 text-sm font-semibold leading-5">{topic.title}</p>
                        <ArrowRight className="shrink-0 text-[var(--muted)]" size={16} />
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="rounded-md bg-white px-2 py-1 text-xs text-[var(--muted)]">{topic.status}</span>
                        <span className="rounded-md bg-white px-2 py-1 text-xs text-[var(--muted)]">{topic.direction}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-md border border-[var(--line)] bg-[var(--panel)] p-5">
                <div className="mb-4 flex items-center gap-2">
                  <FileText className="text-[var(--red)]" size={20} />
                  <h2 className="text-lg font-semibold">最近工具记录</h2>
                </div>
                {toolRuns.map((run) => (
                  <div className="rounded-md border border-[var(--line)] bg-[#fbf8ec] p-3" key={run.id}>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold">{run.toolName}</p>
                      <span className="rounded-md bg-white px-2 py-1 text-xs text-[var(--green)]">{run.status}</span>
                    </div>
                    <p className="text-sm text-[var(--muted)]">{run.inputSummary}</p>
                    <code className="mt-3 block overflow-hidden text-ellipsis rounded-md bg-[var(--ink)] px-3 py-2 text-xs text-[var(--panel)]">
                      {run.command}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function toneClass(tone: string) {
  switch (tone) {
    case "green":
      return "text-[var(--green)]";
    case "blue":
      return "text-[var(--blue)]";
    case "gold":
      return "text-[var(--gold)]";
    case "red":
      return "text-[var(--red)]";
    default:
      return "text-[var(--foreground)]";
  }
}

function statusClass(status: string) {
  switch (status) {
    case "已确认":
      return "bg-[#e5f0e7] text-[var(--green)]";
    case "待确认":
      return "bg-[#f4ead0] text-[var(--gold)]";
    case "需修改":
      return "bg-[#f3ddd9] text-[var(--red)]";
    default:
      return "bg-white text-[var(--muted)]";
  }
}
