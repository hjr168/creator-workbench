import { fetchAIHotItems, type AIHotItem, type FetchAIHotOptions } from "@/lib/aihot";
import { generateTopicCard } from "@/lib/topic-radar/card-generator";
import { buildDailyReportMarkdown } from "@/lib/topic-radar/daily-report";
import { contentHash, normalizeUrl } from "@/lib/topic-radar/hash";
import { calibrateTopicRadarScores, scoreSourceItem } from "@/lib/topic-radar/hkr";
import { getTopicRadarData, saveTopicRadarData } from "@/lib/topic-radar/storage";
import type { FetchLog, SourceItem, TopicRadarItem } from "@/types/topic-radar";

export async function fetchAIHotJob(options: FetchAIHotOptions = {}) {
  const data = await getTopicRadarData();
  const startedAt = new Date().toISOString();
  const params = Object.fromEntries(
    Object.entries(options)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)]),
  );

  try {
    const result = await fetchAIHotItems({
      mode: options.mode ?? "selected",
      category: options.category,
      q: options.q,
      since: options.since,
      limit: options.limit ?? 30,
      cursor: options.cursor,
      cacheTtlMs: options.cacheTtlMs,
    });

    let insertedCount = 0;
    let dedupedCount = 0;
    for (const item of result.items) {
      const normalized = normalizeAIHotItem(item);
      const duplicate = data.sourceItems.find(
        (source) =>
          source.providerItemId === normalized.providerItemId ||
          source.url === normalized.url ||
          source.contentHash === normalized.contentHash,
      );
      if (duplicate) {
        dedupedCount += 1;
        duplicate.updatedAt = new Date().toISOString();
        continue;
      }

      data.sourceItems.unshift(normalized);
      const score = scoreSourceItem(normalized);
      data.hkrScores.unshift(score);
      data.topicCards.unshift(await generateTopicCard(normalized, score));
      insertedCount += 1;
    }

    const log: FetchLog = {
      id: `fetch-${Date.now()}`,
      provider: "aihot",
      mode: options.mode ?? "selected",
      params,
      status: "success",
      fetchedCount: result.items.length,
      insertedCount,
      dedupedCount,
      startedAt,
      finishedAt: new Date().toISOString(),
    };
    data.fetchLogs.unshift(log);
    calibrateTopicRadarScores(data);
    await saveTopicRadarData(data);
    await refreshDailyReport();
    return log;
  } catch (e) {
    const log: FetchLog = {
      id: `fetch-${Date.now()}`,
      provider: "aihot",
      mode: options.mode ?? "selected",
      params,
      status: "failed",
      fetchedCount: 0,
      insertedCount: 0,
      dedupedCount: 0,
      error: e instanceof Error ? e.message : "AIHOT 拉取失败",
      startedAt,
      finishedAt: new Date().toISOString(),
    };
    data.fetchLogs.unshift(log);
    await saveTopicRadarData(data);
    return log;
  }
}

export async function rescoreSourceItem(sourceItemId: string) {
  const data = await getTopicRadarData();
  const source = data.sourceItems.find((item) => item.id === sourceItemId);
  if (!source) return;

  const score = scoreSourceItem(source);
  data.hkrScores = [score, ...data.hkrScores.filter((item) => item.sourceItemId !== sourceItemId)];
  calibrateTopicRadarScores(data);
  const calibratedScore = data.hkrScores.find((item) => item.sourceItemId === sourceItemId) ?? score;
  const card = await generateTopicCard(source, calibratedScore);
  data.topicCards = [card, ...data.topicCards.filter((item) => item.sourceItemId !== sourceItemId)];
  await saveTopicRadarData(data);
  await refreshDailyReport();
}

export async function refreshDailyReport() {
  const data = await getTopicRadarData();
  calibrateTopicRadarScores(data);
  const items = data.topicCards
    .map((card) => {
      const source = data.sourceItems.find((item) => item.id === card.sourceItemId);
      const score = data.hkrScores.find((item) => item.sourceItemId === card.sourceItemId);
      if (!source || !score) return null;
      return { source, score, card };
    })
    .filter((item): item is TopicRadarItem => Boolean(item))
    .sort((a, b) => b.score.total - a.score.total);
  const reportDate = new Date().toISOString().slice(0, 10);
  const markdown = buildDailyReportMarkdown(items);
  data.dailyReports = [
    {
      id: `daily-${reportDate}`,
      reportDate,
      markdown,
      itemIds: items.slice(0, 12).map((item) => item.source.id),
      createdAt: new Date().toISOString(),
    },
    ...data.dailyReports.filter((report) => report.reportDate !== reportDate),
  ];
  await saveTopicRadarData(data);
}

function normalizeAIHotItem(item: AIHotItem): SourceItem {
  const url = normalizeUrl(item.url);
  const hash = contentHash(item.title, item.summary, url);
  const now = new Date().toISOString();
  return {
    id: `src-${hash}`,
    provider: "aihot",
    providerItemId: item.id,
    title: item.title,
    url,
    sourceName: item.source,
    publishedAt: item.publishedAt,
    summary: item.summary,
    category: item.category,
    raw: item,
    contentHash: hash,
    firstSeenAt: now,
    updatedAt: now,
  };
}
