import { useState } from "react";
import Taro, { usePullDownRefresh, useShareAppMessage } from "@tarojs/taro";
import { Button, Picker, Text, View } from "@tarojs/components";
import { StateView } from "@/components/state-view";
import { TopicCard } from "@/components/topic-card";
import { SkeletonList } from "@/components/skeleton-card";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { accountOptions, fetchTopics, getApiBase } from "@/services/api";
import type { AccountType, TopicListResponse } from "@/types/topic-radar";
import "./index.css";

export default function IndexPage() {
  const [account, setAccount] = useState<AccountType>("AI科普号");

  const { data, loading, error, reload } = useAsyncResource<TopicListResponse>(
    (signal) => fetchTopics({ account, limit: 8 }, { signal }),
    [account],
  );

  useShareAppMessage(() => ({
    title: "今日可写：AI 选题雷达",
    path: "/pages/index/index",
  }));

  usePullDownRefresh(() => {
    reload();
    Taro.stopPullDownRefresh();
  });

  const topics = data?.topics ?? [];

  return (
    <View className="page">
      <View className="hero">
        <Text className="eyebrow">AI 选题雷达 · 小程序版</Text>
        <Text className="hero__title">今日可写</Text>
        <Text className="hero__desc">随时查看高分选题、判断今天最值得写什么。</Text>
        <Text className="hero__api">数据源：{getApiBase()}</Text>
      </View>

      <View className="toolbar">
        <Picker
          mode="selector"
          range={accountOptions}
          value={accountOptions.indexOf(account)}
          onChange={(event) => setAccount(accountOptions[Number(event.detail.value)] ?? "AI科普号")}
        >
          <View className="picker">账号类型：{account}</View>
        </Picker>
        <Button className="toolbar__button" onClick={() => Taro.navigateTo({ url: "/pages/topics/index" })}>
          选题库
        </Button>
      </View>

      {loading && topics.length === 0 ? (
        <SkeletonList count={3} />
      ) : error ? (
        <StateView title="加载失败" description={error} actionText="重试" onAction={reload} />
      ) : topics.length ? (
        <View className="list">
          {topics.map((topic, index) => (
            <TopicCard account={account} key={`${topic.id}-${index}`} topic={topic} />
          ))}
        </View>
      ) : (
        <StateView title="暂无选题数据" description="请先在 Web 后台拉取 AIHOT 精选。" actionText="刷新" onAction={reload} />
      )}
    </View>
  );
}
