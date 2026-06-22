import { Component } from "react";
import type { ReactNode } from "react";
import { Button, Text, View } from "@tarojs/components";
import "./error-boundary.css";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

/**
 * 全局渲染异常兜底。
 *
 * 各页面的数据请求失败已由 useAsyncResource + StateView 处理；
 * 这里只兜渲染期的意外异常（如后端返回了不符合类型的数据结构），
 * 避免整页白屏，给用户一个重试入口。
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : "页面渲染异常",
    };
  }

  handleReset = () => {
    this.setState({ hasError: false, message: "" });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View className="error-boundary">
          <Text className="error-boundary__title">页面出了点问题</Text>
          <Text className="error-boundary__desc">{this.state.message}</Text>
          <Button className="error-boundary__button" onClick={this.handleReset}>
            重试
          </Button>
        </View>
      );
    }
    return this.props.children;
  }
}
