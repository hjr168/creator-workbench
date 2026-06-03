import {
  ClipboardList,
  Clock,
  Library,
  MessageSquareText,
  PenLine,
  Play,
  RefreshCw,
  Search,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { getWorkbenchData } from "@/lib/storage/local-json";

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
  const topicCountByStatus = data.topics.reduce<Record<string, number>>((acc, topic) => {
    acc[topic.status] = (acc[topic.status] ?? 0) + 1;
    return acc;
  }, {});

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

          <section className="rounded-md border border-[var(--line)] bg-[var(--panel)]">
            <div className="flex flex-col gap-3 border-b border-[var(--line)] p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold">选题列表</h2>
                <p className="text-sm text-[var(--muted)]">第一版先展示和筛选语义，后续接真实新增/编辑表单。</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--line)] bg-[#fbf8ec] px-3 text-sm text-[var(--muted)]">
                  <Search size={16} />
                  搜索占位
                </span>
                <span className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--line)] bg-[#fbf8ec] px-3 text-sm text-[var(--muted)]">
                  <Tag size={16} />
                  标签筛选
                </span>
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
                  </tr>
                </thead>
                <tbody>
                  {data.topics.map((topic) => (
                    <tr className="border-b border-[var(--line)] last:border-b-0" key={topic.id}>
                      <td className="max-w-[280px] px-5 py-4 font-semibold">{topic.title}</td>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

