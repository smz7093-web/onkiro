// 외부 API 공통 호출 (task.md 4.1): 타임아웃 5초, 실패 시 1회 재시도, 오류 기록.
// API 키는 Secret Manager에서 읽어 넘긴다. 키가 들어간 주소는 로그에 남기지 않는다.

import { logger } from "firebase-functions";

export type ExternalErrorKind = "timeout" | "http" | "parse" | "api";

export class ExternalApiError extends Error {
  constructor(
    readonly api: string,
    readonly kind: ExternalErrorKind,
    message: string,
  ) {
    super(`${api}: ${message}`);
  }
}

export interface FetchOptions {
  api: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;
  // 테스트에서 fetch를 바꿔 끼운다
  fetchImpl?: typeof fetch;
}

// 로그용: 쿼리 문자열(키 포함)을 지운 주소
export function redact(url: string) {
  const i = url.indexOf("?");
  return i < 0 ? url : url.slice(0, i);
}

export async function fetchJson<T = unknown>(
  url: string,
  opts: FetchOptions,
): Promise<T> {
  const {
    api,
    headers,
    timeoutMs = 5000,
    retries = 1,
    fetchImpl = fetch,
  } = opts;
  let last: ExternalApiError | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const started = Date.now();
    try {
      const res = await fetchImpl(url, { headers, signal: ctrl.signal });
      const text = await res.text();
      if (!res.ok) {
        last = new ExternalApiError(api, "http", `HTTP ${res.status}`);
      } else {
        try {
          return JSON.parse(text) as T;
        } catch {
          // 공공데이터포털은 키 오류 등을 XML로 돌려줄 때가 있다
          last = new ExternalApiError(
            api,
            "parse",
            `JSON이 아닌 응답: ${text.slice(0, 120)}`,
          );
        }
      }
    } catch (e) {
      last = ctrl.signal.aborted
        ? new ExternalApiError(api, "timeout", `${timeoutMs}ms 안에 응답 없음`)
        : new ExternalApiError(api, "http", String(e));
    } finally {
      clearTimeout(timer);
    }
    logger.warn("외부 API 실패", {
      api,
      url: redact(url),
      attempt: attempt + 1,
      kind: last?.kind,
      message: last?.message,
      ms: Date.now() - started,
    });
  }
  throw last ?? new ExternalApiError(api, "http", "알 수 없는 오류");
}
