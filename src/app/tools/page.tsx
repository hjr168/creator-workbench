import {
  ClipboardList,
  Code2,
  FileText,
  Library,
  MessageSquareText,
  PenLine,
  Play,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { getWorkbenchData } from "@/lib/storage/local-json";
import { ToolActions } from "./tool-actions";

const navItems = [
  { label: "首页", href: "/", icon: ClipboardList },
  { label: "创作对话", href: "/creation", icon: MessageSquareText },
  { label: "选题库", href: "/topics", icon: Library },
  { label: "工具调用", href: "/tools", icon: Play, active: true },
  { label: "数据复盘", href: "/review", icon: RefreshCw },
];

export const dynamic = "force-dynamic";

export default async function ToolsPage() {
  const data = await getWorkbenchData();

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
              <p className="text-xs text-[var(--muted)]">工具调用</p>
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
            <p className="mb-2 text-sm font-semibold text-[var(--green)]">MVP · 工具调用记录</p>
            <h1 className="max-w-3xl text-3xl font-semibold md:text-4xl">每一次生成都要可确认、可追溯。</h1>
          </header>

          <section className="mb-5 rounded-md border border-[var(--line)] bg-[#fbf8ec] p-5">
            <h2 className="text-lg font-semibold">真实生成状态</h2>
            <div className="mt-3 grid gap-3 text-sm text-[var(--muted)] md:grid-cols-3">
              <p>1. 准备中或失败的记录可以在本页执行本地生成。</p>
              <p>2. 生成会写入真实 Markdown、HTML 和输入 JSON 文件。</p>
              <p>3. 输出路径会回写到工具记录，便于继续人工编辑和复盘。</p>
            </div>
          </section>

          <section className="grid gap-5">
            {data.toolRuns.map((run) => (
              <article className="rounded-md border border-[var(--line)] bg-[var(--panel)]" key={run.id}>
                <div className="flex flex-col gap-3 border-b border-[var(--line)] p-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Code2 className="text-[var(--blue)]" size={20} />
                      <h2 className="text-lg font-semibold">{run.toolName}</h2>
                    </div>
                    <p className="text-sm text-[var(--muted)]">{run.inputSummary}</p>
                  </div>
                  <span className={`w-fit rounded-md px-3 py-1 text-sm font-semibold ${statusClass(run.status)}`}>
                    {run.status}
                  </span>
                </div>

                <div className="space-y-4 p-5">
                  <section>
                    <div className="mb-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <p className="text-sm font-semibold">命令预览</p>
                      <ToolActions
                        canRunGeneration={needsRealGeneration(run)}
                        command={run.command}
                        status={run.status}
                        toolRunId={run.id}
                      />
                    </div>
                    <code className="block overflow-hidden text-ellipsis rounded-md bg-[var(--ink)] px-3 py-3 text-xs text-[var(--panel)]">
                      {run.command ?? "暂无命令"}
                    </code>
                  </section>

                  {run.errorMessage ? (
                    <section className="rounded-md border border-[#e7c2ba] bg-[#fff4f1] p-3 text-sm text-[var(--red)]">
                      {run.errorMessage}
                    </section>
                  ) : null}

                  <section>
                    <p className="mb-2 text-sm font-semibold">输出</p>
                    {run.outputs.length > 0 ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        {run.outputs.map((output) => (
                          <div className="rounded-md border border-[var(--line)] bg-[#fbf8ec] p-3" key={output.id}>
                            <div className="mb-2 flex items-center gap-2">
                              <FileText size={16} />
                              <p className="text-sm font-semibold">{output.label}</p>
                            </div>
                            <p className="text-xs text-[var(--muted)]">{output.path ?? output.url ?? "待生成"}</p>
                            {output.description ? <p className="mt-2 text-sm text-[var(--muted)]">{output.description}</p> : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-md border border-[var(--line)] bg-[#fbf8ec] p-3 text-sm text-[var(--muted)]">
                        暂无输出文件。
                      </p>
                    )}
                  </section>

                  <p className="text-xs text-[var(--muted)]">
                    开始：{run.startedAt ?? "未开始"} · 结束：{run.finishedAt ?? "未结束"}
                  </p>
                </div>
              </article>
            ))}
          </section>
        </section>
      </div>
    </main>
  );
}

function needsRealGeneration(run: Awaited<ReturnType<typeof getWorkbenchData>>["toolRuns"][number]) {
  if (run.toolName !== "manual-command" && run.toolName !== "wechat-article-generator") {
    return false;
  }

  if (run.status === "准备中" || run.status === "失败") {
    return true;
  }

  return run.outputs.some((output) => output.path?.startsWith("~") || output.path?.includes("/待生成/"));
}

function statusClass(status: string) {
  switch (status) {
    case "成功":
      return "bg-[#e5f0e7] text-[var(--green)]";
    case "准备中":
    case "待确认":
      return "bg-[#f4ead0] text-[var(--gold)]";
    case "失败":
      return "bg-[#f3ddd9] text-[var(--red)]";
    default:
      return "bg-white text-[var(--muted)]";
  }
}
