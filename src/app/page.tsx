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
import type { Topic } from "@/types/content";
import type { ToolRun } from "@/types/tool";
import type { CreationSession } from "@/types/workflow";

const topics: Topic[] = [
  {
    id: "topic-001",
    title: "为什么产品经理需要把 AI 工具变成工作流，而不是收藏夹",
    direction: "AI工具",
    platforms: ["公众号", "小红书"],
    contentType: "长文",
    status: "待创作",
    tags: ["AI工作流", "产品经理", "效率"],
    note: "适合从个人真实使用场景切入，强调工具组合和复盘。",
    createdAt: "2026-06-03T09:10:00+08:00",
    updatedAt: "2026-06-03T10:20:00+08:00",
  },
  {
    id: "topic-002",
    title: "我如何用一个本地工作台替代自动日报",
    direction: "自媒体实验",
    platforms: ["公众号"],
    contentType: "长文",
    status: "灵感",
    tags: ["个人IP", "内容系统", "复盘"],
    createdAt: "2026-06-03T11:00:00+08:00",
    updatedAt: "2026-06-03T11:00:00+08:00",
  },
  {
    id: "topic-003",
    title: "项目管理里最容易被忽略的不是计划，而是确认成本",
    direction: "项目管理",
    platforms: ["X", "视频号"],
    contentType: "线程",
    status: "已发布",
    tags: ["项目管理", "沟通", "确认机制"],
    createdAt: "2026-06-01T08:30:00+08:00",
    updatedAt: "2026-06-02T21:15:00+08:00",
  },
];

const activeSession: CreationSession = {
  id: "session-001",
  topicId: "topic-001",
  topicSnapshot: topics[0],
  currentStep: "大纲确认",
  status: "进行中",
  targetPlatform: "公众号",
  targetContentType: "长文",
  confirmedAngle: "方法论",
  confirmedTitleId: "title-001",
  decisions: [
    {
      id: "decision-001",
      step: "选题确认",
      status: "已确认",
      question: "这个选题是否值得写成长文？",
      answer: "值得，重点写工具如何进入稳定工作流。",
      confirmedValue: "AI 工具工作流",
      createdAt: "2026-06-03T10:20:00+08:00",
      updatedAt: "2026-06-03T10:20:00+08:00",
    },
    {
      id: "decision-002",
      step: "角度确认",
      status: "已确认",
      question: "主角度是什么？",
      answer: "方法论，减少工具收藏焦虑。",
      confirmedValue: "方法论",
      createdAt: "2026-06-03T10:28:00+08:00",
      updatedAt: "2026-06-03T10:28:00+08:00",
    },
    {
      id: "decision-003",
      step: "大纲确认",
      status: "待确认",
      question: "是否确认当前大纲并准备生成公众号草稿？",
      createdAt: "2026-06-03T10:36:00+08:00",
      updatedAt: "2026-06-03T10:36:00+08:00",
    },
  ],
  createdAt: "2026-06-03T10:18:00+08:00",
  updatedAt: "2026-06-03T10:36:00+08:00",
};

const toolRuns: ToolRun[] = [
  {
    id: "tool-001",
    sessionId: "session-000",
    topicId: "topic-003",
    toolName: "wechat-html-preview",
    status: "成功",
    command: "python3 scripts/aihot-morning-brief.py --from-md <md-path>",
    inputSummary: "从已确认 Markdown 重新生成 HTML 预览",
    outputs: [
      {
        id: "output-001",
        label: "HTML 预览",
        kind: "html",
        path: "~/Obsidian/公众号推文/2026-06-02-preview.html",
      },
    ],
    createdAt: "2026-06-02T20:00:00+08:00",
    updatedAt: "2026-06-02T20:04:00+08:00",
    startedAt: "2026-06-02T20:02:00+08:00",
    finishedAt: "2026-06-02T20:04:00+08:00",
  },
];

const navItems = [
  { label: "首页", icon: ClipboardList, active: true },
  { label: "创作对话", icon: MessageSquareText },
  { label: "选题库", icon: Library },
  { label: "工具调用", icon: Play },
  { label: "数据复盘", icon: RefreshCw },
];

const stats = [
  { label: "总选题", value: topics.length, tone: "green" },
  { label: "待创作", value: topics.filter((topic) => topic.status === "待创作").length, tone: "blue" },
  { label: "已发布", value: topics.filter((topic) => topic.status === "已发布").length, tone: "gold" },
  { label: "待确认", value: activeSession.decisions.filter((item) => item.status === "待确认").length, tone: "red" },
];

export default function Home() {
  const activeTopic = activeSession.topicSnapshot;

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
              <button
                className={`flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm transition ${
                  item.active
                    ? "bg-[var(--ink)] text-[var(--panel)]"
                    : "text-[var(--muted)] hover:bg-[var(--panel-strong)] hover:text-[var(--foreground)]"
                }`}
                key={item.label}
              >
                <item.icon size={17} />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="mb-5 flex flex-col gap-4 border-b border-[var(--line)] pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold text-[var(--green)]">Phase 2 · 最小可运行工作台</p>
              <h1 className="max-w-3xl text-3xl font-semibold tracking-normal md:text-4xl">
                先确认选题和大纲，再调用工具生成推文。
              </h1>
            </div>
            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[var(--green)] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#275d45]">
              <MessageSquareText size={18} />
              开始创作对话
            </button>
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
                  {activeSession.currentStep}
                </span>
              </div>

              <div className="p-5">
                {activeTopic ? (
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
                      <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white">
                        <CheckCircle2 size={17} />
                        确认大纲
                      </button>
                      <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-transparent px-4 text-sm font-semibold">
                        <Sparkles size={17} />
                        重新生成标题
                      </button>
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

