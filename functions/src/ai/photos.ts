// AI 사진 분석: 올린 사진을 보고 체크리스트 답을 '제안'한다. 답을 정하는 것은 사람이다(화면에서 적용 버튼).
// 사진으로 판단할 수 있는 문항만 다룬다. 문항·선택지는 web/src/lib/engine/checklist.ts와 같은 id다.
// 이 파일은 네트워크를 쓰지 않는다.

import type { CallClaude, ContentBlock, ToolSpec } from "./claude.js";

export const PHOTO_PART_LABELS: Record<string, string> = {
  front: "외관 정면",
  back: "외관 후면",
  left: "외관 좌측",
  right: "외관 우측",
  roof: "지붕",
  yard: "외부 조경",
  kitchen: "주방",
  bathroom: "욕실",
  room: "대표 방",
  crack: "벽체 균열 부위",
};

// 사진으로 볼 수 있는 문항만 (수도·전기·정화조·거주 시기·난방은 사진으로 판단하지 않는다)
export const PHOTO_QUESTIONS = [
  {
    id: "leak",
    label: "비가 새는 곳이 있나요?",
    options: { yes: "예", no: "아니오", unknown: "모름" },
    hint: "지붕 파손·천장 얼룩·곰팡이·물자국",
  },
  {
    id: "crack",
    label: "벽이나 기둥에 금이 간 곳이 있나요?",
    options: { none: "없음", hairline: "가는 금", wide: "손가락 들어갈 정도" },
    hint: "벽체·기둥·기초의 균열 폭",
  },
  {
    id: "tilt",
    label: "집이 한쪽으로 기울어 보이나요?",
    options: { no: "아니오", slight: "조금", severe: "많이" },
    hint: "외관의 수직·수평선, 처마선, 문틀",
  },
  {
    id: "bathroom",
    label: "욕실 상태는?",
    options: { usable: "쓸 만함", partial: "일부 수리", full: "전면 교체" },
    hint: "타일·위생도기·배관·곰팡이",
  },
  {
    id: "kitchen",
    label: "주방 상태는?",
    options: { usable: "쓸 만함", partial: "일부 수리", full: "전면 교체" },
    hint: "싱크대·상판·벽면·환기",
  },
] as const;

export type Confidence = "high" | "medium" | "low";

export interface PhotoSuggestion {
  questionId: string;
  answer: string;
  confidence: Confidence;
  reason: string;
  parts: string[];
}

export interface PhotoInput {
  part: string;
  base64: string;
}

export const PHOTO_TOOL: ToolSpec = {
  name: "checklist_suggestions",
  description: "사진에서 보이는 근거로 체크리스트 답을 제안",
  input_schema: {
    type: "object",
    properties: {
      suggestions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            questionId: {
              type: "string",
              enum: PHOTO_QUESTIONS.map((q) => q.id),
            },
            answer: { type: "string", description: "선택지 id 중 하나" },
            confidence: { type: "string", enum: ["high", "medium", "low"] },
            reason: {
              type: "string",
              description: "사진에서 본 근거 한 문장 (어느 사진의 무엇)",
            },
            parts: {
              type: "array",
              items: { type: "string", enum: Object.keys(PHOTO_PART_LABELS) },
              description: "근거가 된 사진 부위 id",
            },
          },
          required: ["questionId", "answer", "confidence", "reason", "parts"],
        },
      },
    },
    required: ["suggestions"],
  },
};

export const PHOTO_SYSTEM = [
  "당신은 농촌 빈집 사진을 보고 상태 체크리스트 답을 제안하는 건축 조사 보조원입니다.",
  "사진에 실제로 보이는 것만 근거로 쓰세요. 보이지 않으면 그 문항은 제안하지 마세요.",
  "사진만으로는 확실하지 않으므로 확신 정도(high·medium·low)를 정직하게 표시하세요.",
  "구조 안전을 보증하거나 법적 판단을 하지 마세요. 사람 얼굴·차량 번호 등 개인정보는 언급하지 마세요.",
  "근거는 한국어 한 문장으로 쓰세요.",
].join("\n");

export function photoPrompt(parts: string[]): string {
  return [
    `사진은 ${parts.length}장이며 순서대로 다음 부위입니다: ${parts
      .map((p, i) => `${i + 1}번 ${PHOTO_PART_LABELS[p] ?? p}`)
      .join(", ")}.`,
    "",
    "[문항과 선택지 id]",
    ...PHOTO_QUESTIONS.map(
      (q) =>
        `- ${q.id}: ${q.label} (${Object.entries(q.options)
          .map(([id, label]) => `${id}=${label}`)
          .join(", ")}) — 볼 곳: ${q.hint}`,
    ),
  ].join("\n");
}

const CONF: Confidence[] = ["high", "medium", "low"];

// AI 응답 검사: 모르는 문항·선택지는 버리고, 문항당 하나만 남긴다
export function parsePhotoSuggestions(raw: unknown): PhotoSuggestion[] {
  const list = (raw as { suggestions?: unknown })?.suggestions;
  if (!Array.isArray(list)) throw new Error("사진 분석 응답 형식 오류");
  const out: PhotoSuggestion[] = [];
  for (const s of list as Record<string, unknown>[]) {
    const q = PHOTO_QUESTIONS.find((x) => x.id === s?.questionId);
    if (!q || typeof s.answer !== "string" || !(s.answer in q.options))
      continue;
    if (out.some((o) => o.questionId === q.id)) continue;
    out.push({
      questionId: q.id,
      answer: s.answer,
      confidence: CONF.includes(s.confidence as Confidence)
        ? (s.confidence as Confidence)
        : "low",
      reason: typeof s.reason === "string" ? s.reason.trim().slice(0, 200) : "",
      parts: Array.isArray(s.parts)
        ? s.parts.filter(
            (p): p is string => typeof p === "string" && p in PHOTO_PART_LABELS,
          )
        : [],
    });
  }
  return out;
}

export async function analyzePhotos(
  photos: PhotoInput[],
  call: CallClaude,
): Promise<PhotoSuggestion[]> {
  if (photos.length === 0) return [];
  const content: ContentBlock[] = [
    ...photos.map((p): ContentBlock => ({
      type: "image",
      source: { type: "base64", media_type: "image/jpeg", data: p.base64 },
    })),
    { type: "text", text: photoPrompt(photos.map((p) => p.part)) },
  ];
  return parsePhotoSuggestions(
    await call({ system: PHOTO_SYSTEM, content, tool: PHOTO_TOOL }),
  );
}
