import { useMemo, useState } from "react";
import Taro, { usePullDownRefresh, useReachBottom, useShareAppMessage } from "@tarojs/taro";
import { Button, Picker, Text, View } from "@tarojs/components";
import { StateView } from "@/components/state-view";
import { TopicCard } from "@/components/topic-card";
import { SkeletonList } from "@/components/skeleton-card";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { accountOptions, fetchTopics, levelOptions, PAGE_SIZE } from "@/services/api";
import type { AccountType, RecommendationLevel, TopicListResponse } from "@/types/topic-radar";
import "./index.css";

/** 首次拉取的上限，足够覆盖选题库总量；之后按 PAGE_SIZE 前端分页展示 */
const FETCH_LIMIT = 60;

export default function TopicsPage() {
  const [account, setAccount] = useState<AccountType>("AI科普号");
  const [level, setLevel] = useState<RecommendationLevel | "全部">("全部");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { data, loading, error, reload } = useAsyncResource<TopicListResponse>(
    (signal) => fetchTopics({ account, level, limit: FETCH_LIMIT }, { signal }),
    [account, level],
  );

  // 前端分页：只渲染前 visibleCount 条，避免一次渲染过多节点。
  // 用 useMemo 包裹 allTopics，使其引用稳定，否则 `?? []` 每次渲染都产生新数组，
  // 会让下方 topics 的 useMemo 失效。
  const allTopics = useMemo(() => data?.topics ?? [], [data]);
  const topics = useMemo(() => allTopics.slice(0, visibleCount), [allTopics, visibleCount]);
  const hasMore = allTopics.length > visibleCount;

  useShareAppMessage(() => ({
    title: "今日可写选题库",
    path: "/pages/topics/index",
  }));

  usePullDownRefresh(() => {
    reload();
    setVisibleCount(PAGE_SIZE);
    Taro.stopPullDownRefresh();
  });

  // 触底加载更多：前端分页增加可见条数
  useReachBottom(() => {
    if (hasMore && !loading) {
      setVisibleCount((count) => count + PAGE_SIZE);
    }
  });

  return (
    <View className="topics-page">
      <View className="topics-header">
        <Text className="topics-header__title">选题库</Text>
        <Text className="topics-header__desc">按账号类型和推荐级别筛选，优先看值得写的内容。</Text>
      </View>

      <View className="filters">
        <Picker
          mode="selector"
          range={accountOptions}
          value={accountOptions.indexOf(account)}
          onChange={(event) => {
            setAccount(accountOptions[Number(event.detail.value)] ?? "AI科普号");
            setVisibleCount(PAGE_SIZE);
          }}
        >
          <View className="filter">账号：{account}</View>
        </Picker>
        <Picker
          mode="selector"
          range={levelOptions}
          value={levelOptions.indexOf(level)}
          onChange={(event) => {
            setLevel(levelOptions[Number(event.detail.value)] ?? "全部");
            setVisibleCount(PAGE_SIZE);
          }}
        >
          <View className="filter">级别：{level}</View>
        </Picker>
      </View>

      {loading && allTopics.length === 0 ? (
        <SkeletonList count={5} />
      ) : error ? (
        <StateView title="加载失败" description={error} actionText="重试" onAction={reload} />
      ) : topics.length ? (
        <View>
          <View className="result-bar">
            <Text>共 {allTopics.length} 条{hasMore ? `（已加载 ${topics.length}）` : ""}</Text>
            <Button className="refresh" onClick={reload}>
              刷新
            </Button>
          </View>
          {topics.map((topic, index) => (
            <TopicCard account={account} key={`${topic.id}-${index}`} topic={topic} />
          ))}
          {hasMore ? (
            <View className="load-more">
              <Text className="load-more__text">上拉加载更多</Text>
            </View>
          ) : null}
        </View>
      ) : (
        <StateView title="暂无符合条件的选题" description="换一个推荐级别试试。" />
      )}
    </View>
  );
}
