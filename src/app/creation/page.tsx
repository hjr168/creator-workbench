import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  FileText,
  Library,
  MessageSquareText,
  PenLine,
  Play,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { confirmCurrentStep, runActiveGeneration } from "./actions";
import { TitleCandidatesPanel } from "./title-candidates-panel";
import { DecisionCard } from "./decision-card";
import {
  getActiveCreationSession,
  getConfirmedOrLatestOutline,
  getTitleCandidatesForTopic,
  getWorkbenchData,
} from "@/lib/storage/local-json";

const navItems = [
  { label: "首页", href: "/", icon: ClipboardList },
  { label: "创作对话", href: "/creation", icon: MessageSquareText, active: true },
  { label: "选题库", href: "/topics", icon: Library },
  { label: "工具调用", href: "/tools", icon: Play },
  { label: "数据复盘", href: "/review", icon: RefreshCw },
];

export const dynamic = "force-dynamic";

export default async function CreationPage() {
  const workbenchData = await getWorkbenchData();
  const activeSession = getActiveCreationSession(workbenchData);
  const topic = activeSession?.topicSnapshot;
  const titleCandidates = topic ? getTitleCandidatesForTopic(workbenchData, topic.id) : [];
  const selectedTitle = titleCandidates.find((candidate) => candidate.isSelected);
  const outline = topic ? getConfirmedOrLatestOutline(workbenchData, topic.id) : undefined;
  const preparedToolRun = activeSession
    ? workbenchData.toolRuns.find((toolRun) => toolRun.sessionId === activeSession.id)
    : undefined;
  const pendingDecision = activeSession?.decisions.find((decision) => decision.status === "待确认");
  const needsGenerationRun =
    activeSession?.currentStep === "内容生成" && (!preparedToolRun || preparedToolRun.status === "失败");

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
              <p className="text-xs text-[var(--muted)]">创作对话</p>
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
              <Link className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)]" href="/">
                <ArrowLeft size={16} />
                返回首页
              </Link>
              <p className="mb-2 text-sm font-semibold text-[var(--green)]">MVP · 创作对话</p>
              <h1 className="max-w-3xl text-3xl font-semibold tracking-normal md:text-4xl">
                把选题、大纲和工具调用关在同一个确认流程里。
              </h1>
            </div>
            {pendingDecision ? (
              <form action={confirmCurrentStep} className="w-fit">
                <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[var(--green)] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#275d45]">
                  <CheckCircle2 size={18} />
                  确认当前步骤
                </button>
              </form>
            ) : needsGenerationRun ? (
              <form action={runActiveGeneration} className="w-fit">
                <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[var(--green)] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#275d45]">
                  <Play size={18} />
                  执行生成
                </button>
              </form>
            ) : (
              <Link
                className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-md bg-[var(--green)] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#275d45]"
                href="/tools"
              >
                <Play size={18} />
                查看工具调用
              </Link>
            )}
          </header>

          {activeSession && topic ? (
            <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-md border border-[var(--line)] bg-[var(--panel)]">
                <div className="border-b border-[var(--line)] px-5 py-4">
                  <h2 className="text-lg font-semibold">互动确认流</h2>
                  <p className="text-sm text-[var(--muted)]">先把判断收束清楚，再进入推文生成。</p>
                </div>

                <div className="space-y-4 p-5">
                  <div className="rounded-md border border-[var(--line)] bg-[#fbf8ec] p-4">
                    <p className="text-sm text-[var(--muted)]">当前选题</p>
                    <h3 className="mt-2 text-2xl font-semibold leading-snug">{topic.title}</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[topic.direction, activeSession.targetPlatform, activeSession.targetContentType, activeSession.confirmedAngle]
                        .filter(Boolean)
                        .map((item) => (
                          <span className="rounded-md border border-[var(--line)] bg-white px-2.5 py-1 text-sm text-[var(--muted)]" key={item}>
                            {item}
                          </span>
                        ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {activeSession.decisions.map((decision, index) => (
                      <DecisionCard decision={decision} index={index} key={decision.id} />
                    ))}
                  </div>

                  {pendingDecision ? (
                    <div className="rounded-md border border-[var(--line)] bg-[var(--ink)] p-4 text-[var(--panel)]">
                      <p className="mb-1 text-sm opacity-75">当前需要你确认</p>
                      <p className="font-semibold">{pendingDecision.question}</p>
                    </div>
                  ) : (
                    <div className="rounded-md border border-[var(--line)] bg-[#edf4ee] p-4 text-[var(--green)]">
                      <p className="mb-1 text-sm font-semibold">确认流程已完成</p>
                      <p className="text-sm leading-6">下一步请到工具调用页查看命令、输出路径和生成状态。</p>
                    </div>
                  )}
                </div>
              </div>

              <aside className="space-y-5">
                <TitleCandidatesPanel candidates={titleCandidates} />

                <div className="rounded-md border border-[var(--line)] bg-[var(--panel)] p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <FileText className="text-[var(--blue)]" size={20} />
                    <h2 className="text-lg font-semibold">当前大纲</h2>
                  </div>
                  {outline ? (
                    <div className="space-y-4 text-sm leading-6">
                      <section>
                        <p className="mb-1 font-semibold">开头</p>
                        <p className="text-[var(--muted)]">{outline.opening}</p>
                      </section>
                      <section>
                        <p className="mb-1 font-semibold">核心观点</p>
                        <ul className="space-y-1 text-[var(--muted)]">
                          {outline.corePoints.map((point) => (
                            <li key={point}>- {point}</li>
                          ))}
                        </ul>
                      </section>
                      <section>
                        <p className="mb-1 font-semibold">案例</p>
                        <ul className="space-y-1 text-[var(--muted)]">
                          {outline.cases.map((item) => (
                            <li key={item}>- {item}</li>
                          ))}
                        </ul>
                      </section>
                      <section>
                        <p className="mb-1 font-semibold">结尾与引导</p>
                        <p className="text-[var(--muted)]">{outline.ending}</p>
                        <p className="mt-2 text-[var(--muted)]">{outline.callToAction}</p>
                      </section>
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--muted)]">暂无大纲。</p>
                  )}
                </div>

                <div className="rounded-md border border-[var(--line)] bg-[#fbf8ec] p-5">
                  <p className="mb-2 text-sm font-semibold text-[var(--green)]">下一步工具输入</p>
                  {preparedToolRun ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold">{preparedToolRun.inputSummary}</p>
                        <span className="rounded-md bg-white px-2 py-1 text-xs text-[var(--gold)]">
                          {preparedToolRun.status}
                        </span>
                      </div>
                      <code className="block overflow-hidden text-ellipsis rounded-md bg-[var(--ink)] px-3 py-2 text-xs text-[var(--panel)]">
                        {preparedToolRun.command}
                      </code>
                    </div>
                  ) : (
                    <p className="text-sm leading-6 text-[var(--muted)]">
                      确认大纲后，将把「{selectedTitle?.title ?? "已选标题"}」和当前大纲整理为公众号推文生成输入。
                    </p>
                  )}
                </div>
              </aside>
            </section>
          ) : (
            <div className="rounded-md border border-[var(--line)] bg-[var(--panel)] p-8">
              <h2 className="text-xl font-semibold">暂无进行中的创作流</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">后续可以从选题库选择一个选题开始。</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
