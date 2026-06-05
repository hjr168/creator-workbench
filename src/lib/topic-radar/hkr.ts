import type { AccountType, HKRScore, RecommendationLevel, SourceItem } from "@/types/topic-radar";

export const accountWeights: Record<AccountType, { h: number; k: number; r: number }> = {
  AI科普号: { h: 0.32, k: 0.36, r: 0.32 },
  "产品经理/SaaS号": { h: 0.28, k: 0.42, r: 0.3 },
  职场效率号: { h: 0.28, k: 0.28, r: 0.44 },
  创业商业号: { h: 0.38, k: 0.3, r: 0.32 },
  技术开发者号: { h: 0.24, k: 0.5, r: 0.26 },
};

const hotWords = ["OpenAI", "GPT", "Claude", "Gemini", "DeepSeek", "Agent", "AI", "大模型", "发布", "融资", "开源"];
const knowledgeWords = ["论文", "模型", "API", "框架", "评测", "benchmark", "RAG", "MCP", "架构", "代码", "研究"];
const spreadWords = ["免费", "教程", "工具", "效率", "普通人", "职场", "爆火", "指南", "清单", "案例", "对比"];

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
  const total = Math.round(h * 0.35 + k * 0.35 + r * 0.3);

  return {
    id: `hkr-${source.id}`,
    sourceItemId: source.id,
    h,
    k,
    r,
    total,
    level: getLevel(total, h, k, r),
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

export const accountTypeOptions = Object.keys(accountWeights) as AccountType[];

export const hkrFormulaNotes = {
  h: "H = 38 + 时效分 + 热点关键词分 + 行业分类加成，衡量这条动态现在是否处在注意力窗口内。",
  k: "K = 34 + 知识关键词分 + 摘要信息密度分 + 论文分类加成，衡量它能不能写出新知识、新方法或新判断。",
  r: "R = 36 + 传播关键词分 + 标题传播结构分 + 技巧分类加成，衡量它是否容易被公众号读者点击、转发和收藏。",
  total: "默认总分 = H * 0.35 + K * 0.35 + R * 0.30；选择账号类型后，会按该账号的权重重新计算展示分。",
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
  if (/[?？]|为什么|如何|怎么|首次|最/.test(title)) return 8;
  return title.length <= 36 ? 5 : 2;
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getLevel(total: number, h: number, k: number, r: number): RecommendationLevel {
  if (total >= 82) return "强烈推荐";
  if (h >= 78 && r >= 70) return "适合追热点";
  if (k >= 78) return "适合写深度";
  if (total >= 62) return "可关注";
  return "暂不建议";
}
