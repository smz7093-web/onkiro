// 진단 입력 → 견적·위험 신호·3안 수익 (task.md 7.1~7.4). 화면과 스냅샷이 같은 함수를 쓴다.
// 이 파일은 React·Firebase를 import하지 않는다. 같은 입력·버전이면 결과가 항상 같다 (prd.md 7.3).

import {
  DEFAULT_CHECKLIST_RULES,
  evaluateChecklist,
  type ChecklistAnswers,
  type ChecklistResult,
} from "../engine/checklist";
import { calculateEstimate } from "../engine/estimate";
import { calculateScenarios } from "../engine/revenue";
import type {
  AssumptionSet,
  EstimateInput,
  EstimateResult,
  ModuleType,
  PriceTable,
  RevenueInput,
  RevenueResult,
  ScenarioId,
} from "../engine/types";
import { FORMULA_VERSION } from "../engine/version";
import type { Facts } from "./facts";

// 견적 화면에서 고르는 값
export interface EstimateOptions {
  module: ModuleType;
  // 철거 기본 공사를 넣을지 (단가 DB에서 optional인 공정). 조건에 맞으면 자동 포함(demolitionRequired)
  demolition: boolean;
  // 외부·조경(선택 공사)을 넣을지 (10/19)
  exterior?: boolean;
}

export const DEFAULT_ESTIMATE_OPTIONS: EstimateOptions = {
  module: "B",
  demolition: false,
  exterior: false,
};

// 철거를 기본 포함하는 조건 (10/19 석원 확정): '전면 교체' 판정이 하나라도 있거나, 마지막 거주가 5년 이상
export function demolitionRequired(
  answers: Partial<ChecklistAnswers>,
  checklist: ChecklistResult,
): boolean {
  return (
    Object.values(checklist.conditions).includes("full") ||
    answers.lastOccupied === "5to10y" ||
    answers.lastOccupied === "over10y"
  );
}

export interface DiagnosisInputs {
  facts: Facts;
  noRegistry: boolean;
  checklist: ChecklistAnswers;
  missingPhotoParts: number;
  options: EstimateOptions;
  region: string;
}

const num = (facts: Facts, key: keyof Facts, fallback: number) => {
  const v = facts[key]?.value;
  return typeof v === "number" ? v : fallback;
};

export function buildEstimateInput(
  inputs: DiagnosisInputs,
  checklist: ChecklistResult,
): EstimateInput {
  const floors = num(inputs.facts, "floors", 1);
  return {
    floorArea: num(inputs.facts, "floorArea", 0),
    ...(floors > 1 ? { floors } : {}),
    bathrooms: num(inputs.facts, "bathrooms", 1),
    kitchens: num(inputs.facts, "kitchens", 1),
    module: inputs.options.module,
    region: inputs.region,
    conditions: checklist.conditions,
    optionalBaseWork: [
      ...(inputs.options.demolition ||
      demolitionRequired(inputs.checklist, checklist)
        ? (["demolition"] as const)
        : []),
      ...(inputs.options.exterior ? (["exterior"] as const) : []),
    ],
    missingPhotoParts: inputs.missingPhotoParts,
    noRegistry: inputs.noRegistry,
    unknownAnswers: checklist.unknownAnswers,
    ...(inputs.facts.roofStructure?.value === "슬레이트"
      ? { slateRoof: true }
      : {}),
  };
}

// 인허가 간이 확인에 쓰는 대장·토지 정보 (계산에는 쓰지 않는다, 10/14)
export interface SiteSignals {
  mainPurpose: string | null;
  roadSide: string | null;
}

const text = (facts: Facts, key: keyof Facts) => {
  const v = facts[key]?.value;
  return typeof v === "string" && v.trim() ? v.trim() : null;
};

export function siteSignals(facts: Facts): SiteSignals {
  return {
    mainPurpose: text(facts, "mainPurpose"),
    roadSide: text(facts, "roadSide"),
  };
}

export interface EstimateComputation {
  checklist: ChecklistResult;
  estimateInput: EstimateInput;
  estimate: EstimateResult;
  // 위험 신호가 있으면 수익보다 현장진단을 먼저 보여준다 (SIM-10)
  expertRequired: boolean;
  site: SiteSignals;
}

export function computeEstimate(
  inputs: DiagnosisInputs,
  price: PriceTable,
): EstimateComputation {
  // 판정표는 단가 버전에 들어 있다. 같은 단가 버전이면 같은 판정 (prd.md 7.3)
  const checklist = evaluateChecklist(
    inputs.checklist,
    price.checklistRules ?? DEFAULT_CHECKLIST_RULES,
  );
  const estimateInput = buildEstimateInput(inputs, checklist);
  return {
    checklist,
    estimateInput,
    estimate: calculateEstimate(estimateInput, price),
    expertRequired: checklist.riskFlags.length > 0,
    site: siteSignals(inputs.facts),
  };
}

// 실내 마감 등급(하·중·상) = 단가 DB의 실내 모듈 A/B/C (10/14). 금액은 단가 DB로만 계산한다.
// AI(functions/src/ai/grades.ts)는 등급별 자재 예시·추천만 쓰고 금액을 바꾸지 않는다.
export const FINISH_TIERS: {
  module: ModuleType;
  grade: "하" | "중" | "상";
  name: string;
}[] = [
  { module: "A", grade: "하", name: "기본형" },
  { module: "B", grade: "중", name: "표준형" },
  { module: "C", grade: "상", name: "고급형" },
];

// 같은 집·같은 상태로 실내 모듈만 바꿔 세 등급의 견적을 낸다
export function tierEstimates(
  estimateInput: EstimateInput,
  price: PriceTable,
): Record<ModuleType, EstimateResult> {
  return Object.fromEntries(
    FINISH_TIERS.map((t) => [
      t.module,
      calculateEstimate({ ...estimateInput, module: t.module }, price),
    ]),
  ) as Record<ModuleType, EstimateResult>;
}

// 가정값 버전의 기본값에서 시작한다 (SIM-13 "지역 기본값으로")
export function defaultRevenueInput(assumption: AssumptionSet): RevenueInput {
  return { ...assumption.defaults };
}

export function computeScenarios(
  revenueInput: RevenueInput,
  estimateTotal: number,
  assumption: AssumptionSet,
): Record<ScenarioId, RevenueResult> {
  return calculateScenarios(revenueInput, estimateTotal, assumption);
}

// 스냅샷에 남기는 입력 전체 (SIM-20). 이 값과 버전 3종이 같으면 결과도 같다.
export interface SnapshotInputs {
  estimateInput: EstimateInput;
  checklist: ChecklistAnswers;
  revenueInput: RevenueInput;
  priceVersion: string;
  assumptionVersion: string;
  formulaVersion: string;
  // 리포트의 인허가 간이 확인용 (10/14부터, 이전 스냅샷에는 없다)
  site?: SiteSignals;
}

export function snapshotInputs(
  estimateInput: EstimateInput,
  checklist: ChecklistAnswers,
  revenueInput: RevenueInput,
  price: PriceTable,
  assumption: AssumptionSet,
  site?: SiteSignals,
): SnapshotInputs {
  return {
    estimateInput,
    checklist,
    revenueInput,
    priceVersion: price.version,
    assumptionVersion: assumption.version,
    formulaVersion: FORMULA_VERSION,
    ...(site ? { site } : {}),
  };
}

// 키 순서와 관계없이 같은 값이면 같은 문자열
function stableStringify(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  if (v && typeof v === "object") {
    const entries = Object.entries(v as Record<string, unknown>)
      .filter(([, x]) => x !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, x]) => `${JSON.stringify(k)}:${stableStringify(x)}`).join(",")}}`;
  }
  return JSON.stringify(v);
}

// 입력이 마지막 스냅샷과 같은지 비교하는 짧은 지문 (FNV-1a 32비트)
export function inputsKey(inputs: SnapshotInputs): string {
  const s = stableStringify(inputs);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}
