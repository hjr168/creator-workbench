import type { Metadata } from "next";
import Link from "next/link";
import { MarkdownDailyReport } from "@/app/markdown-daily-report";
import { CopyDailyReport } from "./copy-daily-report";
import { SiteSidebar } from "@/app/_components/site-sidebar";
import { formatUpdatedAt, getLatestDataUpdatedAt } from "@/lib/topic-radar/metadata";
import { getTopicRadarData } from "@/lib/topic-radar/storage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "每日选题日报 - 今日可写",
  description: "今日 AI 自媒体可写选题摘要，方便复制、分享和阅读。",
};

export default async function DailyPage() {
  const data = await getTopicRadarData();
  const latestReport = data.dailyReports[0];
  const updatedAt = getLatestDataUpdatedAt(data);

  return (
    <main className="min-h-screen px-5 py-5 text-[var(--foreground)] md:px-8">
      <div className="mx-auto flex w-full max-w-7xl gap-5">
        <SiteSidebar activeHref="/daily" />

        <section className="min-w-0 flex-1">
          <header className="mb-5 border-b border-[var(--line)] pb-5">
            <p className="mb-2 text-sm font-semibold text-[var(--green)]">每日选题日报</p>
            <h1 className="text-3xl font-semibold md:text-4xl">每日选题日报</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              今日 AI 自媒体可写选题摘要，方便复制、分享和阅读。
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">数据更新时间：{formatUpdatedAt(updatedAt)}</p>
          </header>

          {latestReport ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <CopyDailyReport markdown={latestReport.markdown} />
                <Link className="text-sm text-[var(--green)] hover:underline" href="/">
                  返回首页
                </Link>
                <Link className="text-sm text-[var(--green)] hover:underline" href="/topics">
                  查看选题库
                </Link>
              </div>
              <MarkdownDailyReport markdown={latestReport.markdown} />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border border-dashed border-[var(--line)] bg-[var(--panel)] p-8 text-center text-sm text-[var(--muted)]">
                暂无日报。管理员生成日报后这里会自动展示。
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link className="text-sm text-[var(--green)] hover:underline" href="/">
                  返回首页
                </Link>
                <Link className="text-sm text-[var(--green)] hover:underline" href="/topics">
                  查看选题库
                </Link>
              </div>
            </div>
          )}

          <p className="mt-5 rounded-md bg-[#fff6f2] px-3 py-2 text-xs leading-5 text-[var(--red)]">
            日报内容由系统基于公开来源二次分析生成，正式写作前请回源核对事实、时间和上下文。
          </p>
        </section>
      </div>
    </main>
  );
}
