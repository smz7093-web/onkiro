// 진단 입력 → 견적·위험 신호·3안 수익 (task.md 7.1~7.4). 화면과 스냅샷이 같은 함수를 쓴다.
// 이 파일은 React·Firebase를 import하지 않는다. 같은 입력·버전이면 결과가 항상 같다 (prd.md 7.3).

import {
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
  // 철거 기본 공사를 넣을지 (단가 DB에서 optional인 공정)
  demolition: boolean;
}

export const DEFAULT_ESTIMATE_OPTIONS: EstimateOptions = {
  module: "B",
  demolition: false,
};

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
  return {
    floorArea: num(inputs.facts, "floorArea", 0),
    bathrooms: num(inputs.facts, "bathrooms", 1),
    kitchens: num(inputs.facts, "kitchens", 1),
    module: inputs.options.module,
    region: inputs.region,
    conditions: checklist.conditions,
    optionalBaseWork: inputs.options.demolition ? ["demolition"] : [],
    missingPhotoParts: inputs.missingPhotoParts,
    noRegistry: inputs.noRegistry,
    unknownAnswers: checklist.unknownAnswers,
  };
}

export interface EstimateComputation {
  checklist: ChecklistResult;
  estimateInput: EstimateInput;
  estimate: EstimateResult;
  // 위험 신호가 있으면 수익보다 현장진단을 먼저 보여준다 (SIM-10)
  expertRequired: boolean;
}

export function computeEstimate(
  inputs: DiagnosisInputs,
  price: PriceTable,
): EstimateComputation {
  const checklist = evaluateChecklist(inputs.checklist);
  const estimateInput = buildEstimateInput(inputs, checklist);
  return {
    checklist,
    estimateInput,
    estimate: calculateEstimate(estimateInput, price),
    expertRequired: checklist.riskFlags.length > 0,
  };
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
}

export function snapshotInputs(
  estimateInput: EstimateInput,
  checklist: ChecklistAnswers,
  revenueInput: RevenueInput,
  price: PriceTable,
  assumption: AssumptionSet,
): SnapshotInputs {
  return {
    estimateInput,
    checklist,
    revenueInput,
    priceVersion: price.version,
    assumptionVersion: assumption.version,
    formulaVersion: FORMULA_VERSION,
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
