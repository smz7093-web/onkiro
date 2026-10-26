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
    floors: number | null;
    mainPurpose: string | null;
    roadSide: string | null;
    terrain: string | null;
    landUse: string | null;
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
    // 10/19: 확정 콘셉트·대표 마감 (AI 자재 예시가 카드와 어긋나지 않게)
    concept: string;
    finishes: string;
  }[];
  purpose: string;
  // 실내 마감 범위 (MODULE_SCOPE)
  scope: string;
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

// 리모델링 후 모습 AI 가상 이미지 (외관 정면 사진 → 등급별). Storage 경로를 돌려준다
// 그릴 대상 (10/19): 전체 외관(정면 사진)·대표 방·욕실·주방 (functions/src/ai/render.ts RENDER_TARGETS)
export type RenderTarget = "exterior" | "room" | "bathroom" | "kitchen";

// photoId: 그릴 사진 (없으면 서버가 그 부위의 가장 최근 사진을 쓴다)
export async function renderRemodel(
  assessmentId: string,
  module: ModuleType,
  photoId?: string,
  target: RenderTarget = "exterior",
): Promise<{ storagePath: string; cached: boolean; photoId?: string }> {
  return (
    await httpsCallable<
      {
        assessmentId: string;
        module: ModuleType;
        photoId?: string;
        target: RenderTarget;
      },
      { storagePath: string; cached: boolean; photoId?: string }
    >(functions, "renderRemodel", { timeout: 120_000 })({
      assessmentId,
      module,
      target,
      ...(photoId ? { photoId } : {}),
    })
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

// AI 인허가 안내 (RAG, 10/26, functions/src/ai/permits.ts). 인허가 자료에서 찾은 것만 근거로 쓰고 출처를 붙인다
export type PermitOperator = "owner" | "entrust" | "unknown";

export interface PermitQuery {
  floorArea: number | null;
  structure: string | null;
  approvalDate: string | null;
  zoning: string | null;
  landUse: string | null;
  mainPurpose: string | null;
  roadSide: string | null;
  roofStructure: string | null;
  noRegistry: boolean;
  operator: PermitOperator;
  question: string | null;
}

export interface PermitGuideResult {
  summary: string;
  items: {
    title: string;
    level: "caution" | "check" | "info";
    explanation: string;
    nextAction: string;
    sourceIds: string[];
  }[];
  unanswered: string[];
  sources: {
    id: string;
    title: string;
    source: string;
    url: string | null;
    reviewed: boolean;
  }[];
}

export async function askPermitGuide(
  assessmentId: string,
  query: PermitQuery,
): Promise<AiResponse<PermitGuideResult>> {
  return (
    await httpsCallable<
      { assessmentId: string; query: PermitQuery },
      AiResponse<PermitGuideResult>
    >(functions, "askPermitGuide", { timeout: 120_000 })({
      assessmentId,
      query,
    })
  ).data;
}
