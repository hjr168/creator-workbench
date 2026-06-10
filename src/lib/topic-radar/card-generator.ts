import { accountTypeOptions } from "@/lib/topic-radar/hkr";
import type { AccountType, HKRScore, SourceItem, TopicCard } from "@/types/topic-radar";

const categoryAccounts: Record<string, AccountType[]> = {
  "ai-products": ["AI科普号", "职场效率号", "产品经理/SaaS号"],
  tip: ["职场效率号", "AI科普号"],
  paper: ["技术开发者号", "AI科普号", "产品经理/SaaS号"],
  industry: ["创业商业号", "产品经理/SaaS号"],
};

export async function generateTopicCard(source: SourceItem, score: HKRScore): Promise<TopicCard> {
  const llmCard = await tryGenerateWithLLM(source, score);
  if (llmCard) return llmCard;
  return generateHeuristicTopicCard(source, score);
}

export function generateHeuristicTopicCard(source: SourceItem, score: HKRScore): TopicCard {
  const accounts = categoryAccounts[source.category ?? ""] ?? ["AI科普号", "产品经理/SaaS号"];
  const core = stripSourcePrefix(source.title);
  const now = new Date().toISOString();

  return {
    id: `card-${source.id}`,
    sourceItemId: source.id,
    title: core,
    oneLineSummary: summarizeWithoutCopying(source),
    whyWorthWriting: `这条动态的 HKR 总分为 ${score.total}，兼具热点时效和可解释空间，适合改写成“发生了什么、为什么重要、普通创作者如何判断”的公众号选题。`,
    recommendedTitles: [
      `别只看热闹，${core}真正值得关注的是这三点`,
      `${core}：今天 AI 创作者可以怎么写`,
      `从${shortTitle(core)}看 AI 行业的新变化`,
    ],
    writingAngles: [
      "先解释事件本身，再拆出对普通用户、产品团队或开发者的实际影响。",
      "避免复述上游摘要，重点写自己的判断、对比和可操作建议。",
      "把技术动态翻译成公众号读者能理解的机会、风险和行动清单。",
    ],
    outline: [
      "开头：用一句话说明这件事为什么今天值得关注。",
      "背景：交代原始事件、来源、发布时间和关键事实。",
      "分析：从热点势能、知识增量、传播潜力三个角度拆解。",
      "写作建议：给出适合的账号类型、标题方向和读者收获。",
      "结尾：提醒读者回到原文核对，并给出你的独立判断。",
    ],
    suitableAccounts: accounts,
    difficulty: score.k >= 80 ? "高" : score.total >= 76 ? "中" : "低",
    factsToVerify: [
      "原文发布时间、主体名称、产品或模型版本是否准确。",
      "涉及数据、融资、价格、性能指标时必须回源确认。",
      "如果引用第三方观点，需要确认上下文并保留原文链接。",
    ],
    extendableViews: [
      "这件事对公众号读者的实际工作流有什么影响。",
      "同类产品或技术路线是否正在形成趋势。",
      "它是短期热点，还是可以沉淀为长期选题资产。",
    ],
    risks: [
      "AIHOT 仍是测试版信源，正式写作前必须打开原文核对事实。",
      "不要直接复制上游摘要，需加入独立分析和面向读者的二次结构化。",
      "涉及未发布能力、传闻或商业数据时，标题不要过度确定。",
    ],
    recommendedApproach: score.level === "适合写深度" ? "深度解释 + 对比分析" : "热点解释 + 实用启发",
    generatedBy: "heuristic",
    createdAt: now,
    updatedAt: now,
  };
}

const LLM_TIMEOUT_MS = 15_000;
const VALID_ACCOUNTS = new Set<string>(accountTypeOptions);

async function tryGenerateWithLLM(source: SourceItem, score: HKRScore): Promise<TopicCard | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.TOPIC_RADAR_LLM_MODEL ?? "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "你是公众号选题编辑。不要复制上游摘要，要基于原始事实生成二次选题卡。输出 JSON，字段包括 oneLineSummary, whyWorthWriting, recommendedTitles, writingAngles, outline, suitableAccounts, difficulty, factsToVerify, extendableViews, risks, recommendedApproach。",
          },
          {
            role: "user",
            content: JSON.stringify({
              source: {
                title: source.title,
                summary: source.summary,
                sourceName: source.sourceName,
                publishedAt: source.publishedAt,
                url: source.url,
                category: source.category,
              },
              score,
            }),
          },
        ],
      }),
    });
    if (!res.ok) {
      console.error(`[card-generator] LLM returned ${res.status}: ${await res.text().catch(() => "")}`);
      return null;
    }
    const json = await res.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content);
    const now = new Date().toISOString();
    const rawAccounts = asStringArray(parsed.suitableAccounts).filter((a: string) => VALID_ACCOUNTS.has(a)) as AccountType[];
    return {
      id: `card-${source.id}`,
      sourceItemId: source.id,
      title: stripSourcePrefix(source.title),
      oneLineSummary: String(parsed.oneLineSummary ?? summarizeWithoutCopying(source)),
      whyWorthWriting: String(parsed.whyWorthWriting ?? ""),
      recommendedTitles: asStringArray(parsed.recommendedTitles),
      writingAngles: asStringArray(parsed.writingAngles),
      outline: asStringArray(parsed.outline),
      suitableAccounts: rawAccounts.length ? rawAccounts : categoryAccounts[source.category ?? ""] ?? ["AI科普号"],
      difficulty: ["低", "中", "高"].includes(parsed.difficulty) ? parsed.difficulty : "中",
      factsToVerify: asStringArray(parsed.factsToVerify),
      extendableViews: asStringArray(parsed.extendableViews),
      risks: asStringArray(parsed.risks),
      recommendedApproach: String(parsed.recommendedApproach ?? "热点解释 + 实用启发"),
      generatedBy: "llm",
      createdAt: now,
      updatedAt: now,
    };
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      console.error(`[card-generator] LLM request timed out after ${LLM_TIMEOUT_MS}ms for source ${source.id}`);
    } else {
      console.error(`[card-generator] LLM generation failed for source ${source.id}:`, e instanceof Error ? e.message : e);
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function summarizeWithoutCopying(source: SourceItem) {
  const sourceName = source.sourceName || "上游信源";
  return `${sourceName} 发布了一条关于「${shortTitle(source.title)}」的 AI 动态，可转化为面向公众号读者的趋势解释或实用判断。`;
}

function stripSourcePrefix(title: string) {
  return title.replace(/^\s*[\[【].*?[\]】]\s*/, "").trim();
}

function shortTitle(title: string) {
  return stripSourcePrefix(title).replace(/[。.!！?？].*$/, "").slice(0, 28);
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
}
