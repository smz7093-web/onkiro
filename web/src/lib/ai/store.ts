import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase/client";
import type { ModuleType } from "../engine/types";

// AI 등급 설명·사진 분석 (functions/src/ai). 금액은 단가 DB 계산값이고, AI는 설명·제안만 한다.

export interface GradeExplainInput {
  house: {
    address: string | null;
    floorArea: number | null;
    structure: string | null;
    roofStructure: string | null;
    approvalDate: string | null;
    zoning: string | null;
  };
  checklist: { question: string; answer: string }[];
  tiers: {
    module: ModuleType;
    grade: "하" | "중" | "상";
    name: string;
    unitPrice: number;
    total: number;
    rangeLow: number;
    rangeHigh: number;
  }[];
  purpose: string;
}

export interface GradeExplanation {
  recommended: ModuleType;
  reason: string;
  tiers: { module: ModuleType; materials: string[]; fit: string }[];
  cautions: string[];
}

export interface PhotoSuggestion {
  questionId: string;
  answer: string;
  confidence: "high" | "medium" | "low";
  reason: string;
  parts: string[];
}

interface AiResponse<T> {
  result: T;
  cached: boolean;
  model: string;
}

// 함수 오류를 화면 문구로 (서버가 보낸 한국어 메시지를 그대로 쓴다)
export function aiErrorMessage(e: unknown): string {
  const msg = e instanceof Error ? e.message : "";
  return /[가-힣]/.test(msg)
    ? msg
    : "AI가 응답하지 않습니다. 잠시 뒤 다시 시도해 주세요.";
}

export async function explainGrades(
  assessmentId: string,
  input: GradeExplainInput,
): Promise<AiResponse<GradeExplanation>> {
  return (
    await httpsCallable<
      { assessmentId: string; input: GradeExplainInput },
      AiResponse<GradeExplanation>
    >(functions, "explainGrades", { timeout: 120_000 })({ assessmentId, input })
  ).data;
}

export async function analyzeDiagnosisPhotos(
  assessmentId: string,
): Promise<AiResponse<PhotoSuggestion[]>> {
  return (
    await httpsCallable<
      { assessmentId: string },
      AiResponse<PhotoSuggestion[]>
    >(functions, "analyzeDiagnosisPhotos", { timeout: 180_000 })({
      assessmentId,
    })
  ).data;
}
