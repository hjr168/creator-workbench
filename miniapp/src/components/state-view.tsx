import { View, Text, Button } from "@tarojs/components";
import "./state-view.css";

export function StateView({
  title,
  description,
  actionText,
  onAction,
}: {
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}) {
  return (
    <View className="state-view">
      <Text className="state-view__title">{title}</Text>
      {description ? <Text className="state-view__desc">{description}</Text> : null}
      {actionText && onAction ? (
        <Button className="state-view__button" onClick={onAction}>
          {actionText}
        </Button>
      ) : null}
    </View>
  );
}
