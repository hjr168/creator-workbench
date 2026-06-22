import { View } from "@tarojs/components";
import "./skeleton-card.css";

/** 选题卡骨架占位，首屏加载时替代纯文字提示，减少白屏感。 */
export function SkeletonCard() {
  return (
    <View className="skeleton-card">
      <View className="skeleton-card__meta">
        <View className="skeleton-card__pill skeleton-shimmer" />
        <View className="skeleton-card__pill skeleton-shimmer" />
      </View>
      <View className="skeleton-card__line skeleton-shimmer" />
      <View className="skeleton-card__line skeleton-shimmer" />
      <View className="skeleton-card__line skeleton-card__line--short skeleton-shimmer" />
    </View>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </>
  );
}
