import path from "node:path";
import { readJsonDocument, writeJsonDocument } from "@/lib/storage/json-document-store";
import { calibrateTopicRadarScores } from "@/lib/topic-radar/hkr";
import type { TopicRadarData, TopicRadarItem } from "@/types/topic-radar";

const dataFilePath = path.join(process.cwd(), "src/data/topic-radar.json");
const dataDocumentKey = "topic_radar";

const emptyData: TopicRadarData = {
  sourceItems: [],
  hkrScores: [],
  topicCards: [],
  fetchLogs: [],
  dailyReports: [],
};

export async function getTopicRadarData(): Promise<TopicRadarData> {
  const data = await readJsonDocument<TopicRadarData>(dataDocumentKey, dataFilePath, emptyData);
  return calibrateTopicRadarScores({ ...emptyData, ...data });
}

export async function saveTopicRadarData(data: TopicRadarData) {
  await writeJsonDocument(dataDocumentKey, dataFilePath, data);
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
