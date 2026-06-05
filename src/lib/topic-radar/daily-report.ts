import type { TopicRadarItem } from "@/types/topic-radar";

export function buildDailyReportMarkdown(items: TopicRadarItem[], reportDate = new Date()) {
  const date = reportDate.toISOString().slice(0, 10);
  const top = items.slice(0, 3);
  const hot = items.filter((item) => item.score.level === "适合追热点").slice(0, 3);
  const deep = items.filter((item) => item.score.level === "适合写深度").slice(0, 3);
  const tool = items.filter((item) => item.card.suitableAccounts.includes("职场效率号")).slice(0, 3);
  const watch = items.filter((item) => item.score.level === "可关注" || item.score.level === "暂不建议").slice(0, 5);

  return [
    `# 今日可写选题日报 ${date}`,
    "",
    `今日一句判断：今天 AI 选题应优先选择“能解释变化、能给出行动建议、且可回源核对”的内容。`,
    "",
    section("今日最值得写", top),
    section("适合追热点", hot),
    section("适合写深度", deep),
    section("适合工具推荐", tool),
    section("不建议写但可关注", watch),
    "",
    "> 写作提醒：AIHOT / RSS 为测试版外部信源，正式写作前请打开原文链接核对事实、时间、数据和上下文；不要直接复制上游摘要。",
    "",
  ].join("\n");
}

function section(title: string, items: TopicRadarItem[]) {
  if (!items.length) return `## ${title}\n\n暂无。`;
  return [
    `## ${title}`,
    "",
    ...items.map(
      (item, index) =>
        `${index + 1}. **${item.card.title}**（HKR ${item.score.total}）\n   - 来源：${item.source.sourceName}｜发布时间：${item.source.publishedAt}\n   - 推荐写法：${item.card.recommendedApproach}\n   - 原文：${item.source.url}`,
    ),
  ].join("\n");
}
