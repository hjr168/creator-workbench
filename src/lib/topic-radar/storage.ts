import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { TopicRadarData, TopicRadarItem } from "@/types/topic-radar";

const dataFilePath = path.join(process.cwd(), "src/data/topic-radar.json");

const emptyData: TopicRadarData = {
  sourceItems: [],
  hkrScores: [],
  topicCards: [],
  fetchLogs: [],
  dailyReports: [],
};

export async function getTopicRadarData(): Promise<TopicRadarData> {
  try {
    const raw = await readFile(dataFilePath, "utf-8");
    return { ...emptyData, ...(JSON.parse(raw) as TopicRadarData) };
  } catch {
    return emptyData;
  }
}

export async function saveTopicRadarData(data: TopicRadarData) {
  await writeFile(dataFilePath, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
}

export async function getTopicRadarItems(): Promise<TopicRadarItem[]> {
  const data = await getTopicRadarData();
  return data.topicCards
    .map((card) => {
      const source = data.sourceItems.find((item) => item.id === card.sourceItemId);
      const score = data.hkrScores.find((item) => item.sourceItemId === card.sourceItemId);
      if (!source || !score) return null;
      return { source, score, card };
    })
    .filter((item): item is TopicRadarItem => Boolean(item))
    .sort((a, b) => b.score.total - a.score.total);
}

export async function findTopicRadarItem(id: string): Promise<TopicRadarItem | undefined> {
  const items = await getTopicRadarItems();
  return items.find((item) => item.card.id === id || item.source.id === id);
}
