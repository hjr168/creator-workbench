import Taro from "@tarojs/taro";
import { View, Text } from "@tarojs/components";
import type { AccountType, MiniappTopicListItem } from "@/types/topic-radar";
import { formatDateTime } from "@/utils/format";
import "./topic-card.css";

export function TopicCard({
  topic,
  account,
}: {
  topic: MiniappTopicListItem;
  account: AccountType;
}) {
  function openDetail() {
    Taro.navigateTo({
      url: `/pages/topics/detail?id=${encodeURIComponent(topic.id)}&account=${encodeURIComponent(account)}`,
    });
  }

  return (
    <View className="topic-card" onClick={openDetail}>
      <View className="topic-card__meta">
        <Text className="topic-card__level">{topic.recommendationLevel}</Text>
        <Text className="topic-card__score">账号分 {topic.accountScore}</Text>
      </View>
      <Text className="topic-card__title">{topic.title}</Text>
      <Text className="topic-card__summary">{topic.oneLineSummary}</Text>
      <View className="topic-card__source">
        <Text>{topic.source.name}</Text>
        <Text>{formatDateTime(topic.source.publishedAt)}</Text>
        <Text>HKR {topic.hkr.total}</Text>
      </View>
      <View className="topic-card__tags">
        {topic.tags.slice(0, 4).map((tag) => (
          <Text className="topic-card__tag" key={tag}>
            {tag}
          </Text>
        ))}
      </View>
    </View>
  );
}
