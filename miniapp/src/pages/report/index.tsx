import Taro, { usePullDownRefresh, useShareAppMessage } from "@tarojs/taro";
import { Button, Text, View } from "@tarojs/components";
import { StateView } from "@/components/state-view";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { fetchLatestDailyReport } from "@/services/api";
import type { DailyReportResponse } from "@/types/topic-radar";
import { formatDateTime, parseMarkdown } from "@/utils/format";
import "./index.css";

export default function ReportPage() {
  const { data, loading, error, reload } = useAsyncResource<DailyReportResponse>(
    (signal) => fetchLatestDailyReport({ signal }),
    [],
  );
  const report = data?.report;

  useShareAppMessage(() => ({
    title: report ? `选题日报 ${report.reportDate}` : "今日可写选题日报",
    path: "/pages/report/index",
  }));

  usePullDownRefresh(() => {
    reload();
    Taro.stopPullDownRefresh();
  });

  function copyReport() {
    if (!report) return;
    Taro.setClipboardData({ data: report.markdown });
  }

  if (loading) {
    return <StateView title="正在加载选题日报" />;
  }

  if (error || !report) {
    return (
      <StateView
        title="暂无日报"
        description={error || "请先在 Web 后台生成日报。"}
        actionText="重试"
        onAction={reload}
      />
    );
  }

  const lines = parseMarkdown(report.markdown, 80);

  return (
    <View className="report-page">
      <View className="report-header">
        <Text className="report-header__eyebrow">Markdown 日报</Text>
        <Text className="report-header__title">{report.reportDate}</Text>
        <Text className="report-header__meta">
          {report.itemIds.length} 条选题 · {formatDateTime(report.createdAt)}
        </Text>
        <Button className="copy-button" onClick={copyReport}>
          复制完整日报
        </Button>
      </View>

      <View className="markdown-card">
        {lines.map((line, index) => {
          if (line.type === "h1" || line.type === "h2") {
            return (
              <Text className="markdown-card__heading" key={index}>
                {line.text}
              </Text>
            );
          }
          if (line.type === "h3") {
            return (
              <Text className="markdown-card__subheading" key={index}>
                {line.text}
              </Text>
            );
          }
          if (line.type === "list") {
            return (
              <Text className="markdown-card__list-item" key={index}>
                · {line.text}
              </Text>
            );
          }
          return (
            <Text className="markdown-card__line" key={index}>
              {line.text}
            </Text>
          );
        })}
      </View>
    </View>
  );
}
