import { useCallback, useEffect, useRef, useState } from "react";
import { MiniAbortController, isAbortError } from "@/services/abort";

/**
 * 异步资源加载 hook，内置竞态保护与可重置的 loading 状态。
 *
 * - 通过 AbortController 保证：当上游依赖变化触发新请求时，
 *   上一次未完成的请求结果会被丢弃，避免慢请求覆盖快请求。
 * - 手动调用 `reload` 时同样会取消上一次请求。
 * - 支持 `manual: true` 延迟到 `reload()` 才发起首次请求（分页场景）。
 *
 * Taro.request 不原生支持 AbortSignal 取消网络层，本 hook 在结果返回前
 * 检查信号；取消语义为「丢弃结果」，足够消除竞态。
 */
export interface AsyncResource<T> {
  data: T | undefined;
  loading: boolean;
  error: string;
  reload: () => void;
  setData: (updater: T | ((prev: T | undefined) => T)) => void;
}

export function useAsyncResource<T>(
  fetcher: (signal: MiniAbortController["signal"]) => Promise<T>,
  deps: ReadonlyArray<unknown>,
  options: { manual?: boolean } = {},
): AsyncResource<T> {
  const { manual = false } = options;
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(!manual);
  const [error, setError] = useState("");
  // fetcher 可能每次渲染都是新引用，用 ref 持有最新值，避免它进入 effect 依赖造成重复请求。
  const fetcherRef = useRef(fetcher);
  const controllerRef = useRef<MiniAbortController | null>(null);

  const run = useCallback(() => {
    const controller = new MiniAbortController();
    setLoading(true);
    setError("");
    fetcherRef
      .current(controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setData(result);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || isAbortError(err)) return;
        setError(err instanceof Error ? err.message : "加载失败");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return controller;
  }, []);

  const reload = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = run();
  }, [run]);

  // 持有最新 fetcher：在 effect 中赋值是安全的（effect 在渲染提交后执行，非渲染期）。
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    if (manual) return;
    controllerRef.current?.abort();
    // 数据加载 effect 的固有模式：run 内部会 setLoading。
    // 这里由 deps 变化驱动请求，不是无意义的级联渲染，故豁免该规则。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    controllerRef.current = run();
    return () => controllerRef.current?.abort();
    // deps 由调用方透传（spread），无法静态校验，故豁免 exhaustive-deps。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, manual, ...deps]);

  return { data, loading, error, reload, setData };
}
