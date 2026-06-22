import type React from "react";
import Taro, { usePullDownRefresh, useShareAppMessage } from "@tarojs/taro";
import { Button, Text, View } from "@tarojs/components";
import { StateView } from "@/components/state-view";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { accountOptions, fetchTopicDetail } from "@/services/api";
import type { AccountType, TopicDetailResponse } from "@/types/topic-radar";
import { formatDateTime } from "@/utils/format";
import "./detail.css";

export default function TopicDetailPage() {
  const instance = Taro.getCurrentInstance();
  const id = String(instance.router?.params.id ?? "");
  const account = parseAccount(String(instance.router?.params.account ?? ""));

  const { data, loading, error, reload } = useAsyncResource<TopicDetailResponse>(
    (signal) => {
      if (!id) return Promise.reject(new Error("缺少选题 ID"));
      return fetchTopicDetail(id, account, { signal });
    },
    [account, id],
  );

  const topic = data?.topic;

  useShareAppMessage(() => ({
    title: topic?.title ?? "今日可写选题卡",
    path: `/pages/topics/detail?id=${encodeURIComponent(id)}&account=${encodeURIComponent(account)}`,
  }));

  usePullDownRefresh(() => {
    reload();
    Taro.stopPullDownRefresh();
  });

  function copyOriginalUrl() {
    if (!topic?.source.url) return;
    Taro.setClipboardData({ data: topic.source.url });
  }

  if (loading) {
    return <StateView title="正在加载选题详情" />;
  }

  if (error || !topic) {
    return <StateView title="加载失败" description={error || "选题不存在"} actionText="重试" onAction={reload} />;
  }

  return (
    <View className="detail-page">
      <View className="detail-hero">
        <View className="detail-hero__meta">
          <Text>{topic.recommendationLevel}</Text>
          <Text>HKR {topic.hkr.total}</Text>
          <Text>账号分 {topic.accountScore}</Text>
        </View>
        <Text className="detail-hero__title">{topic.title}</Text>
        <Text className="detail-hero__summary">{topic.oneLineSummary}</Text>
        <View className="detail-hero__source">
          <Text>{topic.source.name}</Text>
          <Text>{formatDateTime(topic.source.publishedAt)}</Text>
        </View>
      </View>

      <View className="notice">
        <Text>正式写作前请核对原文事实、发布时间、数据和上下文。</Text>
        <Button className="notice__button" onClick={copyOriginalUrl}>
          复制原文链接
        </Button>
      </View>

      <Section title="为什么值得写">
        <Text className="paragraph">{topic.whyWorthWriting}</Text>
      </Section>

      <Section title="推荐标题">
        <List items={topic.recommendedTitles} />
      </Section>

      <Section title="文章大纲">
        <List items={topic.outline} />
      </Section>

      <Section title="推荐角度">
        <List items={topic.writingAngles} />
      </Section>

      <Section title="HKR 评分解释">
        <ScoreLine label="H 热点势能" value={topic.hkr.h} reason={topic.scoreReasons.h} />
        <ScoreLine label="K 知识增量" value={topic.hkr.k} reason={topic.scoreReasons.k} />
        <ScoreLine label="R 传播潜力" value={topic.hkr.r} reason={topic.scoreReasons.r} />
      </Section>

      <Section title="事实核对">
        <List items={topic.factsToVerify} />
      </Section>

      <Section title="风险提示">
        <List items={topic.risks} />
      </Section>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="section">
      <Text className="section__title">{title}</Text>
      {children}
    </View>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <View className="list-block">
      {items.map((item, index) => (
        <Text className="list-block__item" key={index}>
          {item}
        </Text>
      ))}
    </View>
  );
}

function ScoreLine({ label, value, reason }: { label: string; value: number; reason: string }) {
  return (
    <View className="score-line">
      <View className="score-line__head">
        <Text>{label}</Text>
        <Text>{value}</Text>
      </View>
      <Text className="score-line__reason">{reason}</Text>
    </View>
  );
}

function parseAccount(value: string): AccountType {
  return accountOptions.includes(value as AccountType) ? (value as AccountType) : "AI科普号";
}
