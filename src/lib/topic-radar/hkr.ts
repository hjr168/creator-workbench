import type { AccountType, HKRScore, RecommendationLevel, SourceItem, TopicRadarData } from "@/types/topic-radar";

export const accountWeights: Record<AccountType, { h: number; k: number; r: number }> = {
  AI科普号: { h: 0.32, k: 0.36, r: 0.32 },
  "产品经理/SaaS号": { h: 0.28, k: 0.42, r: 0.3 },
  职场效率号: { h: 0.28, k: 0.28, r: 0.44 },
  创业商业号: { h: 0.38, k: 0.3, r: 0.32 },
  技术开发者号: { h: 0.24, k: 0.5, r: 0.26 },
};

const hotWords = ["OpenAI", "GPT", "Claude", "Gemini", "DeepSeek", "Agent", "AI", "大模型", "发布", "融资", "开源"];
const knowledgeWords = ["论文", "模型", "API", "框架", "评测", "benchmark", "RAG", "MCP", "架构", "代码", "研究"];
const spreadWords = [
  "免费",
  "教程",
  "工具",
  "效率",
  "普通人",
  "职场",
  "爆火",
  "指南",
  "清单",
  "案例",
  "对比",
  "替代",
  "降本",
  "岗位",
  "微信",
  "实测",
  "开源",
  "上手",
  "使用",
  "影响",
  "变化",
];

export function scoreSourceItem(source: SourceItem, now = new Date()): HKRScore {
  const text = `${source.title}\n${source.summary ?? ""}\n${source.category ?? ""}`;
  const ageHours = Math.max(0, (now.getTime() - new Date(source.publishedAt).getTime()) / 36e5);
  const recency = ageHours <= 6 ? 30 : ageHours <= 24 ? 22 : ageHours <= 72 ? 14 : 7;

  const h = clamp(
    38 + recency + keywordScore(text, hotWords, 4) + (source.category === "industry" ? 8 : 0),
  );
  const k = clamp(
    34 + keywordScore(text, knowledgeWords, 6) + lengthBonus(source.summary) + (source.category === "paper" ? 12 : 0),
  );
  const r = clamp(
    36 + keywordScore(text, spreadWords, 5) + titleSpreadBonus(source.title) + (source.category === "tip" ? 12 : 0),
  );
  const total = Math.round(h * 0.35 + k * 0.3 + r * 0.35);

  return {
    id: `hkr-${source.id}`,
    sourceItemId: source.id,
    h,
    k,
    r,
    total,
    level: getFallbackLevel(total, h, k),
    reasons: {
      h: `发布时间距今约 ${Math.round(ageHours)} 小时，标题与摘要中热点信号${keywordHits(text, hotWords)}。`,
      k: `技术、产品或方法信息密度${keywordHits(text, knowledgeWords)}，适合提炼知识增量。`,
      r: `传播关键词${keywordHits(text, spreadWords)}，可包装为公众号读者容易理解的切口。`,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function scoreForAccount(score: HKRScore, accountType: AccountType) {
  const weights = accountWeights[accountType];
  return Math.round(score.h * weights.h + score.k * weights.k + score.r * weights.r);
}

export function calibrateTopicRadarScores(data: TopicRadarData, now = new Date()) {
  const existingBySourceId = new Map(data.hkrScores.map((score) => [score.sourceItemId, score]));
  const recalculatedScores = data.sourceItems.map((source) => {
    const existing = existingBySourceId.get(source.id);
    const score = scoreSourceItem(source, now);
    return {
      ...score,
      id: existing?.id ?? score.id,
      createdAt: existing?.createdAt ?? score.createdAt,
      updatedAt:
        existing && existing.h === score.h && existing.k === score.k && existing.r === score.r && existing.total === score.total
          ? existing.updatedAt
          : score.updatedAt,
    };
  });
  data.hkrScores = assignRecommendationLevels(recalculatedScores, data.sourceItems, now);
  return data;
}

export function assignRecommendationLevels(scores: HKRScore[], sources: SourceItem[], now = new Date()): HKRScore[] {
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const eligible = scores
    .filter((score) => {
      const source = sourceById.get(score.sourceItemId);
      if (!source || score.total < 64) return false;
      return getAgeHours(source.publishedAt, now) <= 72;
    })
    .sort((a, b) => {
      const sourceA = sourceById.get(a.sourceItemId);
      const sourceB = sourceById.get(b.sourceItemId);
      return (
        b.total - a.total ||
        b.h + b.k + b.r - (a.h + a.k + a.r) ||
        new Date(sourceB?.publishedAt ?? 0).getTime() - new Date(sourceA?.publishedAt ?? 0).getTime()
      );
    });
  const strongCount = eligible.length ? Math.min(3, Math.max(1, Math.ceil(eligible.length * 0.12))) : 0;
  const strongIds = new Set(eligible.slice(0, strongCount).map((score) => score.sourceItemId));
  const updatedAt = new Date().toISOString();

  return scores.map((score) => {
    const level = strongIds.has(score.sourceItemId) ? "强烈推荐" : getFallbackLevel(score.total, score.h, score.k);
    return score.level === level ? score : { ...score, level, updatedAt };
  });
}

export const accountTypeOptions = Object.keys(accountWeights) as AccountType[];

export const hkrFormulaNotes = {
  h: "H = 38 + 时效分 + 热点关键词分 + 行业分类加成，衡量这条动态现在是否处在注意力窗口内。",
  k: "K = 34 + 知识关键词分 + 摘要信息密度分 + 论文分类加成，衡量它能不能写出新知识、新方法或新判断。",
  r: "R = 36 + 传播关键词分 + 标题传播结构分 + 技巧分类加成，衡量它是否容易被公众号读者点击、转发和收藏。",
  total: "默认总分 = H * 0.35 + K * 0.30 + R * 0.35；选择账号类型后，会按该账号的权重重新计算展示分。推荐级别会在最近 72 小时内容池中校准，每日精选 1-3 条强烈推荐。",
};

function keywordScore(text: string, words: string[], points: number) {
  return words.reduce((sum, word) => sum + (text.toLowerCase().includes(word.toLowerCase()) ? points : 0), 0);
}

function keywordHits(text: string, words: string[]) {
  const hits = words.filter((word) => text.toLowerCase().includes(word.toLowerCase()));
  return hits.length ? `较明显（${hits.slice(0, 4).join("、")}）` : "偏弱";
}

function lengthBonus(summary?: string) {
  const length = summary?.length ?? 0;
  if (length > 220) return 14;
  if (length > 100) return 9;
  if (length > 40) return 5;
  return 0;
}

function titleSpreadBonus(title: string) {
  let bonus = title.length <= 36 ? 7 : 3;
  if (/[?？]|为什么|如何|怎么/.test(title)) bonus += 6;
  if (/首次|最|新|发布|上线|开源/.test(title)) bonus += 5;
  if (/\d|一|二|三|四|五|六|七|八|九|十/.test(title)) bonus += 4;
  if (/使用|影响|变化|替代|降本|效率|上手|实测/.test(title)) bonus += 5;
  return Math.min(bonus, 20);
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getAgeHours(publishedAt: string, now: Date) {
  return Math.max(0, (now.getTime() - new Date(publishedAt).getTime()) / 36e5);
}

function getFallbackLevel(total: number, h: number, k: number): RecommendationLevel {
  if (h >= 76 && total >= 58) return "适合追热点";
  if (k >= 70 && total >= 58) return "适合写深度";
  if (total >= 52) return "可关注";
  return "暂不建议";//test
}
