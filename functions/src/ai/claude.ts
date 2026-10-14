// Claude API 호출 (AI 등급 설명·사진 분석). 결과는 도구(tool) 입력 형식으로만 받는다(정해진 JSON).
// 키는 Secret Manager ANTHROPIC_API_KEY. 로그에 키·사진을 남기지 않는다.

import { logger } from "firebase-functions";

// 기능별 모델 (10/14): 등급 설명은 글만 다뤄 Sonnet(비용을 낮춘다), 사진 분석은 정확도가 중요해 Opus
export const AI_MODELS = {
  grades: "claude-sonnet-5-5",
  photos: "claude-opus-5-5",
} as const;
export type AiKind = keyof typeof AI_MODELS;
const ENDPOINT = "https://api.anthropic.com/v1/messages";

export type ContentBlock =
  | { type: "text"; text: string }
  | {
      type: "image";
      source: { type: "base64"; media_type: "image/jpeg"; data: string };
    };

export interface ToolSpec {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export interface ClaudeRequest {
  system: string;
  content: ContentBlock[];
  tool: ToolSpec;
  maxTokens?: number;
}

export type CallClaude = (req: ClaudeRequest) => Promise<unknown>;

export class AiUnavailable extends Error {}

// 키가 없거나 임시값(pending)이면 AI 기능을 끈다 (배포 도구가 선언된 키를 모두 요구한다)
export const hasKey = (key: string | undefined) =>
  !!key && key.trim() !== "" && key.trim() !== "pending";

export function claudeCaller(
  apiKey: string,
  model: string,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = 90_000,
): CallClaude {
  return async ({ system, content, tool, maxTokens = 2000 }) => {
    if (!hasKey(apiKey)) throw new AiUnavailable("AI 키가 아직 없습니다");
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetchImpl(ENDPOINT, {
        method: "POST",
        signal: ctrl.signal,
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          system,
          tools: [tool],
          tool_choice: { type: "tool", name: tool.name },
          messages: [{ role: "user", content }],
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        logger.warn("claude 호출 실패", {
          status: res.status,
          body: body.slice(0, 300),
        });
        throw new AiUnavailable(`AI 응답 오류 (${res.status})`);
      }
      const json = (await res.json()) as {
        content?: { type: string; name?: string; input?: unknown }[];
      };
      const use = json.content?.find(
        (c) => c.type === "tool_use" && c.name === tool.name,
      );
      if (!use) throw new AiUnavailable("AI 응답 형식이 다릅니다");
      return use.input;
    } catch (e) {
      if (e instanceof AiUnavailable) throw e;
      logger.warn("claude 호출 실패", { error: String(e) });
      throw new AiUnavailable("AI가 응답하지 않습니다");
    } finally {
      clearTimeout(timer);
    }
  };
}
