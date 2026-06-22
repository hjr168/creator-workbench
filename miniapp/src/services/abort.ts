/**
 * 极简 AbortSignal/AbortController 实现。
 *
 * 微信小程序运行时没有原生 AbortController，且我们只需「丢弃过期请求结果」
 * 的语义（Taro.request 网络层无法真正中止），因此不依赖 DOMException，
 * 也不用引入 polyfill 包。
 */
export interface MiniAbortSignal {
  aborted: boolean;
}

export class MiniAbortController {
  signal: MiniAbortSignal = { aborted: false };

  abort() {
    this.signal.aborted = true;
  }
}

export class AbortError extends Error {
  name = "AbortError" as const;
  constructor(message = "aborted") {
    super(message);
  }
}

export function isAbortError(err: unknown): boolean {
  return err instanceof AbortError || (err instanceof Error && err.name === "AbortError");
}
