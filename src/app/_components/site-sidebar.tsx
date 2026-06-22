import { Gauge, Library, PenLine, Sparkles } from "lucide-react";
import Link from "next/link";

type NavItem = {
  label: string;
  href: string;
  icon: typeof Sparkles;
};

// 面向普通用户的侧边栏：只保留今日可写 / 选题库 / HKR评分方法。
// 故意不含「管理后台」入口——后台仅限授权访问，不向普通用户暴露。
const navItems: NavItem[] = [
  { label: "今日可写", href: "/", icon: Sparkles },
  { label: "选题库", href: "/topics", icon: Library },
  { label: "HKR评分方法", href: "/hkr", icon: Gauge },
];

export function SiteSidebar({ activeHref }: { activeHref: string }) {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-[var(--line)] pr-5 lg:block">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-md bg-[var(--ink)] text-[var(--panel)]">
          <PenLine size={20} />
        </div>
        <div>
          <p className="text-sm font-semibold">今日可写</p>
          <p className="text-xs text-[var(--muted)]">公众号 AI 选题雷达</p>
        </div>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const active = item.href === activeHref;
          return (
            <Link
              className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm ${
                active ? "bg-[var(--ink)] text-[var(--panel)]" : "text-[var(--muted)] hover:bg-[var(--panel-strong)]"
              }`}
              href={item.href}
              key={item.label}
            >
              <item.icon size={17} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
