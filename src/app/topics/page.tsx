import {
  ClipboardList,
  Clock,
  Library,
  MessageSquareText,
  PenLine,
  Play,
  Plus,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { getActiveCreationSession, getWorkbenchData } from "@/lib/storage/local-json";
import { fetchSelectedItems } from "@/lib/aihot";
import { createTopicAndStart, startCreationFromTopic } from "./actions";
import { AIHotSearch } from "./aihot-search";

const navItems = [
  { label: "首页", href: "/", icon: ClipboardList },
  { label: "创作对话", href: "/creation", icon: MessageSquareText },
  { label: "选题库", href: "/topics", icon: Library, active: true },
  { label: "工具调用", href: "/tools", icon: Play },
  { label: "数据复盘", href: "/review", icon: RefreshCw },
];

export const dynamic = "force-dynamic";

export default async function TopicsPage() {
  const data = await getWorkbenchData();
  const activeSession = getActiveCreationSession(data);
  const topicCountByStatus = data.topics.reduce<Record<string, number>>((acc, topic) => {
    acc[topic.status] = (acc[topic.status] ?? 0) + 1;
    return acc;
  }, {});

  const importedIds = new Set(
    data.topics
      .filter((t) => t.note?.includes("aihot:"))
      .map((t) => {
        const match = t.note?.match(/aihot:([^\s]+)/);
        return match?.[1];
      })
      .filter((id): id is string => typeof id === "string"),
  );

  let aihotItems: Awaited<ReturnType<typeof fetchSelectedItems>>["items"] = [];
  let aihotError: string | null = null;
  try {
    const since = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const result = await fetchSelectedItems(since, 15);
    aihotItems = result.items;
  } catch (e) {
    aihotError = e instanceof Error ? e.message : "获取 AIHot 精选失败";
  }

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
              <p className="text-xs text-[var(--muted)]">选题库</p>
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
            <p className="mb-2 text-sm font-semibold text-[var(--green)]">MVP · 选题管理</p>
            <h1 className="max-w-3xl text-3xl font-semibold md:text-4xl">所有内容想法先进入选题库。</h1>
          </header>

          <section className="mb-5 grid gap-3 md:grid-cols-4">
            {["灵感", "待创作", "已发布", "已复盘"].map((status) => (
              <div className="rounded-md border border-[var(--line)] bg-[var(--panel)] p-4" key={status}>
                <p className="text-sm text-[var(--muted)]">{status}</p>
                <p className="mt-2 text-3xl font-semibold text-[var(--green)]">{topicCountByStatus[status] ?? 0}</p>
              </div>
            ))}
          </section>

          <section className="mb-5 rounded-md border border-[var(--line)] bg-[var(--panel)]">
            <div className="border-b border-[var(--line)] px-5 py-4">
              <div className="flex items-center gap-2">
                <Plus className="text-[var(--green)]" size={20} />
                <h2 className="text-lg font-semibold">新增真实选题</h2>
              </div>
              <p className="text-sm text-[var(--muted)]">提交后会保存到本地 JSON，并立即进入这个选题的创作流。</p>
            </div>
            <form action={createTopicAndStart} className="grid gap-4 p-5 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">选题标题</span>
                  <input
                    className="h-11 w-full rounded-md border border-[var(--line)] bg-[#fbf8ec] px-3 text-sm outline-none focus:border-[var(--green)]"
                    name="title"
                    placeholder="例如：我如何用一个真实工作台跑完内容生产流程"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">备注</span>
                  <textarea
                    className="min-h-24 w-full rounded-md border border-[var(--line)] bg-[#fbf8ec] px-3 py-3 text-sm outline-none focus:border-[var(--green)]"
                    name="note"
                    placeholder="写下真实背景、切入角度或你想保留的判断。"
                  />
                </label>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">方向</span>
                    <select className="h-11 w-full rounded-md border border-[var(--line)] bg-[#fbf8ec] px-3 text-sm" name="direction">
                      {["产品思考", "AI工具", "项目管理", "个人成长", "自媒体实验"].map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">类型</span>
                    <select className="h-11 w-full rounded-md border border-[var(--line)] bg-[#fbf8ec] px-3 text-sm" name="contentType">
                      {["长文", "图文", "短视频", "线程"].map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <fieldset>
                  <legend className="mb-2 text-sm font-semibold">平台</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {["公众号", "小红书", "视频号", "X"].map((item) => (
                      <label className="flex h-10 items-center gap-2 rounded-md border border-[var(--line)] bg-[#fbf8ec] px-3 text-sm" key={item}>
                        <input defaultChecked={item === "公众号"} name="platforms" type="checkbox" value={item} />
                        {item}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">标签</span>
                  <input
                    className="h-11 w-full rounded-md border border-[var(--line)] bg-[#fbf8ec] px-3 text-sm outline-none focus:border-[var(--green)]"
                    name="tags"
                    placeholder="用逗号或空格分隔，例如 MVP 内容系统 复盘"
                  />
                </label>

                <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[var(--green)] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#275d45]">
                  <Plus size={18} />
                  保存并开始创作
                </button>
              </div>
            </form>
          </section>

          <AIHotSearch defaultItems={aihotItems} importedIds={importedIds} />

          <section className="rounded-md border border-[var(--line)] bg-[var(--panel)]">
            <div className="flex flex-col gap-3 border-b border-[var(--line)] p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold">选题列表</h2>
                <p className="text-sm text-[var(--muted)]">选择一个选题后，会进入当前创作对话流。</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-left text-sm">
                <thead className="border-b border-[var(--line)] text-[var(--muted)]">
                  <tr>
                    <th className="px-5 py-3 font-medium">标题</th>
                    <th className="px-5 py-3 font-medium">方向</th>
                    <th className="px-5 py-3 font-medium">平台</th>
                    <th className="px-5 py-3 font-medium">类型</th>
                    <th className="px-5 py-3 font-medium">状态</th>
                    <th className="px-5 py-3 font-medium">标签</th>
                    <th className="px-5 py-3 font-medium">更新时间</th>
                    <th className="px-5 py-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topics.map((topic) => {
                    const isActive = activeSession?.topicId === topic.id;

                    return (
                      <tr
                        className={`border-b border-[var(--line)] last:border-b-0 ${
                          isActive ? "bg-[#edf4ee]" : ""
                        }`}
                        key={topic.id}
                      >
                        <td className="max-w-[280px] px-5 py-4 font-semibold">
                          <div className="space-y-2">
                            <p>{topic.title}</p>
                            {isActive ? (
                              <span className="inline-flex rounded-md bg-white px-2 py-1 text-xs text-[var(--green)]">
                                当前创作
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-5 py-4">{topic.direction}</td>
                        <td className="px-5 py-4">{topic.platforms.join(" / ")}</td>
                        <td className="px-5 py-4">{topic.contentType}</td>
                        <td className="px-5 py-4">
                          <span className="rounded-md bg-[#fbf8ec] px-2 py-1 text-xs text-[var(--green)]">{topic.status}</span>
                        </td>
                        <td className="px-5 py-4 text-[var(--muted)]">{topic.tags.join("、")}</td>
                        <td className="px-5 py-4 text-[var(--muted)]">
                          <span className="inline-flex items-center gap-1">
                            <Clock size={14} />
                            {topic.updatedAt}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {isActive ? (
                            <Link
                              className="inline-flex h-9 items-center justify-center rounded-md border border-[var(--line)] px-3 text-sm font-semibold"
                              href="/creation"
                            >
                              继续创作
                            </Link>
                          ) : (
                            <form action={startCreationFromTopic.bind(null, topic.id)}>
                              <button className="inline-flex h-9 items-center justify-center rounded-md bg-[var(--green)] px-3 text-sm font-semibold text-white">
                                切换创作
                              </button>
                            </form>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
