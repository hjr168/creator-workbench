import { accountWeights, hkrFormulaNotes } from "@/lib/topic-radar/hkr";
import { SiteSidebar } from "@/app/_components/site-sidebar";

export default function HkrPage() {
  return (
    <main className="min-h-screen px-5 py-5 text-[var(--foreground)] md:px-8">
      <div className="mx-auto flex w-full max-w-7xl gap-5">
        <SiteSidebar activeHref="/hkr" />

        <section className="min-w-0 flex-1">
          <header className="mb-5 border-b border-[var(--line)] pb-5">
            <p className="mb-2 text-sm font-semibold text-[var(--green)]">HKR 评分方法</p>
            <h1 className="max-w-3xl text-3xl font-semibold md:text-4xl">用写作价值，而不是资讯热度，判断今天该写什么。</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              HKR 是「今日可写」用来筛选公众号选题的三维评分：H 看热点势能，K 看知识增量，R 看阅读传播潜力。强烈推荐采用每日精选口径，从最近内容池里挑出最值得优先写的 1-3 条。
            </p>
          </header>

          <section className="mb-5 rounded-md border border-[var(--line)] bg-[var(--panel)] p-5">
            <h2 className="text-xl font-semibold">为什么要 HKR</h2>
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              <Reason title="避免只追热闹" text="公众号选题不能只看谁最热，还要判断这条动态能否转化成读者真正有收获的内容。" />
              <Reason title="避免只搬摘要" text="K 会提醒创作者补充背景、对比、方法和判断，减少把上游摘要改写一遍的低价值内容。" />
              <Reason title="贴近账号定位" text="同一条新闻对技术号、效率号、商业号的价值不同，账号加权分会按定位重新排序。" />
            </div>
          </section>

          <section className="mb-5 grid gap-3 lg:grid-cols-3">
            <Metric
              label="H 热点势能"
              text="衡量这条动态是否处在注意力窗口内，是否包含热门主体、发布、融资、开源等热点信号。"
              formula={hkrFormulaNotes.h}
              examples={["发布时间越近，时效分越高。", "OpenAI、Claude、Agent、大模型等关键词会增加热点信号。", "行业动态类内容有额外加成。"]}
            />
            <Metric
              label="K 知识增量"
              text="衡量它能不能写出新知识、新方法、新对比或新判断。K 高的选题更适合做解释型、深度型内容。"
              formula={hkrFormulaNotes.k}
              examples={["论文、模型、API、框架、评测等关键词会提高 K。", "摘要信息越充分，越容易提炼知识增量。", "论文类内容有额外加成。"]}
            />
            <Metric
              label="R 阅读传播潜力"
              text="衡量它是否容易被公众号读者点击、收藏、转发，尤其关注普通读者能否快速理解收益。"
              formula={hkrFormulaNotes.r}
              examples={["免费、教程、工具、效率、清单等关键词会提高 R。", "标题带有问题、方法、首次、最等结构会提高传播分。", "技巧类内容有额外加成。"]}
            />
          </section>

          <section className="mb-5 rounded-md border border-[var(--line)] bg-[var(--panel)] p-5">
            <h2 className="text-xl font-semibold">怎么用</h2>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <Usage title="先看推荐级别" text="原始总分用于判断基础质量，强烈推荐会在最近 72 小时内容池里做每日精选校准。" />
              <Usage title="再看账号加权分" text="首页和选题库会按账号类型重新计算展示分。这个分数用于排序，帮助不同账号找到更适合自己的选题。" />
              <Usage title="点开 HKR 看细节" text="首页和选题库的 HKR 分数都可以点击，弹窗会显示 H/K/R 分项、命中原因、公式和当前账号权重。" />
              <Usage title="回源核对事实" text="HKR 只帮助做选题判断，不替代事实核查。正式写作前仍然要打开原文核对发布时间、数据和上下文。" />
            </div>
          </section>

          <section className="mb-5 rounded-md border border-[var(--line)] bg-[var(--panel)] p-5">
            <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="mb-2 text-sm font-semibold text-[var(--green)]">实际例子</p>
                <h2 className="text-xl font-semibold">普通自媒体用户怎么看懂一个 HKR 分数</h2>
              </div>
              <p className="text-sm text-[var(--muted)]">H、K、R 每项满分 100 分，总分也按 100 分制展示。</p>
            </div>

            <div className="rounded-md bg-[#fbf8ec] p-4">
              <p className="text-sm text-[var(--muted)]">示例选题</p>
              <h3 className="mt-1 text-lg font-semibold">某 AI 工具发布新功能：普通人可以用它 10 分钟做完一份行业资料整理</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                这个选题不是让你复述新闻，而是写给公众号读者看：新功能到底解决什么问题、适合谁用、普通人怎么马上试一次。
              </p>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-4">
              <ExampleScore label="H 热点势能" score={86} text="刚发布，处在讨论窗口内，且涉及热门 AI 工具和功能更新。" />
              <ExampleScore label="K 知识增量" score={74} text="能解释工具能力、使用场景和方法，但技术深度不是特别高。" />
              <ExampleScore label="R 阅读传播潜力" score={88} text="普通人能理解，标题容易写成教程、清单或效率提升案例。" />
              <ExampleScore label="总分" score={82} text="按 H/K/R 加权后质量很高，进入最近内容池时通常会被优先标为强烈推荐。" highlight />
            </div>

            <div className="mt-4 rounded-md border border-[var(--line)] p-4 text-sm leading-6">
              <p className="font-semibold">为什么判断为可以写</p>
              <p className="mt-1 text-[var(--muted)]">
                它的 H 高，说明热点还新；K 达到中高，说明不只是新闻，可以拆出工具方法和读者收益；R 很高，说明普通读者容易点击和收藏。对自媒体用户来说，这类选题适合当天写成“发生了什么 + 我该怎么用 + 值不值得跟”的文章。
              </p>
            </div>
          </section>

          <section className="mb-5 rounded-md border border-[var(--line)] bg-[var(--panel)] p-5">
            <h2 className="text-xl font-semibold">推荐等级对应分数</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              推荐等级先看原始 HKR 总分和 H/K/R 分项，再把最近 72 小时的高分内容做每日精选校准。
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="border-b border-[var(--line)] text-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">推荐等级</th>
                    <th className="px-4 py-3 font-medium">评分范围</th>
                    <th className="px-4 py-3 font-medium">怎么理解</th>
                    <th className="px-4 py-3 font-medium">建议动作</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      level: "强烈推荐",
                      range: "最近 72 小时且总分 >= 64 的 Top 1-3 条",
                      meaning: "在当天内容池里最值得优先写，不再要求绝对高分到 82。",
                      action: "可以当天写，适合作为头条或重点文章。",
                    },
                    {
                      level: "适合追热点",
                      range: "H >= 76 且总分 >= 58",
                      meaning: "热度足够强，但未必适合长篇深挖。",
                      action: "适合快速解释、观点短文、热点跟进。",
                    },
                    {
                      level: "适合写深度",
                      range: "K >= 70 且总分 >= 58",
                      meaning: "知识密度高，适合拆解背景、技术、方法或趋势。",
                      action: "适合做深度分析、教程、对比评测。",
                    },
                    {
                      level: "可关注",
                      range: "总分 >= 52",
                      meaning: "有一定选题价值，但需要找好角度，不能直接照搬新闻。",
                      action: "可以放入备选池，等待更多信息或结合账号定位再写。",
                    },
                    {
                      level: "暂不建议",
                      range: "总分 < 52",
                      meaning: "当前写作价值偏低，可能热度弱、信息少或读者收益不清晰。",
                      action: "先不写，除非它和你的账号定位高度相关。",
                    },
                  ].map((item) => (
                    <tr className="border-b border-[var(--line)] last:border-b-0" key={item.level}>
                      <td className="px-4 py-3 font-semibold">{item.level}</td>
                      <td className="px-4 py-3 text-[var(--blue)]">{item.range}</td>
                      <td className="px-4 py-3 text-[var(--muted)]">{item.meaning}</td>
                      <td className="px-4 py-3 text-[var(--muted)]">{item.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-md border border-[var(--line)] bg-[var(--panel)] p-5">
            <h2 className="text-xl font-semibold">账号类型权重</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead className="border-b border-[var(--line)] text-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">账号类型</th>
                    <th className="px-4 py-3 font-medium">H</th>
                    <th className="px-4 py-3 font-medium">K</th>
                    <th className="px-4 py-3 font-medium">R</th>
                    <th className="px-4 py-3 font-medium">适用判断</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(accountWeights).map(([name, weights]) => (
                    <tr className="border-b border-[var(--line)] last:border-b-0" key={name}>
                      <td className="px-4 py-3 font-semibold">{name}</td>
                      <td className="px-4 py-3">{percent(weights.h)}</td>
                      <td className="px-4 py-3">{percent(weights.k)}</td>
                      <td className="px-4 py-3">{percent(weights.r)}</td>
                      <td className="px-4 py-3 text-[var(--muted)]">{accountHint(name)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function Reason({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-md bg-[#fbf8ec] p-4">
      <p className="font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{text}</p>
    </div>
  );
}

function Metric({
  label,
  text,
  formula,
  examples,
}: {
  label: string;
  text: string;
  formula: string;
  examples: string[];
}) {
  return (
    <article className="rounded-md border border-[var(--line)] bg-[var(--panel)] p-5">
      <h2 className="text-lg font-semibold">{label}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{text}</p>
      <p className="mt-3 rounded-md bg-[#fbf8ec] px-3 py-2 text-xs leading-5 text-[var(--muted)]">{formula}</p>
      <ul className="mt-3 space-y-2 text-sm leading-6">
        {examples.map((item) => (
          <li className="rounded-md bg-[#fbf8ec] px-3 py-2" key={item}>
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}

function Usage({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-md bg-[#fbf8ec] p-4 text-sm leading-6">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-[var(--muted)]">{text}</p>
    </div>
  );
}

function ExampleScore({
  label,
  score,
  text,
  highlight = false,
}: {
  label: string;
  score: number;
  text: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-md border p-4 ${highlight ? "border-[var(--green)] bg-[#edf4ee]" : "border-[var(--line)] bg-[#fbf8ec]"}`}>
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-[var(--blue)]">{score}</p>
      <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{text}</p>
    </div>
  );
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function accountHint(name: string) {
  const hints: Record<string, string> = {
    AI科普号: "均衡判断热点、解释价值和传播性。",
    "产品经理/SaaS号": "更重视产品启发、方法论和知识增量。",
    职场效率号: "更重视读者可操作、可收藏、可转发。",
    创业商业号: "更重视趋势窗口、行业变化和商业机会。",
    技术开发者号: "更重视技术细节、工程实践和新知识。",
  };
  return hints[name] ?? "按账号定位重新排序。";
}
