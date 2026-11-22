// 진단 검수 (ADM-03, task.md 11.4). 담당자가 공정별 판정·금액을 고치면 견적·3안 수익을 다시 계산한다.
// 이 파일은 React·Firebase를 import하지 않는다. 원래 스냅샷은 그대로 두고 결과는 새 스냅샷(reason=review)으로 저장한다.
import { calculateEstimate } from "../engine/estimate";
import { calculateScenarios } from "../engine/revenue";
import type {
  AssumptionSet,
  ConditionGrade,
  EstimateInput,
  EstimateResult,
  PriceTable,
  ProcessId,
  RevenueInput,
  RevenueResult,
  ScenarioId,
} from "../engine/types";

// 공정 하나의 보정: 판정을 바꾸거나(단가 DB로 다시 계산), 금액을 직접 정한다(원, 지역계수 적용 뒤 최종 금액)
export interface ProcessEdit {
  grade?: ConditionGrade;
  cost?: number;
}
export type ReviewEdits = Partial<Record<ProcessId, ProcessEdit>>;

export interface ReviewChange {
  process: ProcessId;
  fromGrade: ConditionGrade | null;
  toGrade: ConditionGrade | null;
  fromCost: number;
  toCost: number;
}

export interface ReviewResult {
  estimateInput: EstimateInput;
  estimate: EstimateResult;
  scenarios: Record<ScenarioId, RevenueResult>;
  changes: ReviewChange[];
}

export function applyReview(
  base: { estimateInput: EstimateInput; estimate: EstimateResult },
  revenueInput: RevenueInput,
  price: PriceTable,
  assumption: Pick<AssumptionSet, "scenarioDeltas" | "occupancyRange">,
  edits: ReviewEdits,
): ReviewResult {
  const conditions = { ...base.estimateInput.conditions };
  for (const [id, e] of Object.entries(edits) as [ProcessId, ProcessEdit][])
    if (e?.grade) conditions[id] = e.grade;
  const estimateInput: EstimateInput = { ...base.estimateInput, conditions };
  const auto = calculateEstimate(estimateInput, price);

  const processes = auto.processes.map((p) => {
    const cost = edits[p.id]?.cost;
    return cost === undefined ? p : { ...p, cost };
  });
  // 판정이 양호라 자동 견적에 없는 공정에 금액만 넣은 경우 (예: 현장 확인 후 보강비)
  for (const [id, e] of Object.entries(edits) as [ProcessId, ProcessEdit][]) {
    if (e?.cost === undefined || processes.some((p) => p.id === id)) continue;
    processes.push({
      id,
      grade: conditions[id] ?? "good",
      baseCost: 0,
      repairCost: 0,
      cost: e.cost,
      days: 0,
    });
  }
  const subtotal = processes.reduce((s, p) => s + p.cost, 0);
  const contingency = subtotal * price.contingencyRate;
  const total = subtotal + contingency;
  const unit = price.rangeRoundingUnit;
  const estimate: EstimateResult = {
    ...auto,
    processes,
    subtotal,
    contingency,
    total,
    rangeLow: Math.max(
      0,
      Math.floor((total * (1 - auto.uncertainty)) / unit) * unit,
    ),
    rangeHigh: Math.ceil((total * (1 + auto.uncertainty)) / unit) * unit,
  };

  const before = new Map(base.estimate.processes.map((p) => [p.id, p]));
  const after = new Map(processes.map((p) => [p.id, p]));
  const ids = [...new Set([...before.keys(), ...after.keys()])];
  const changes: ReviewChange[] = [];
  for (const id of ids) {
    const b = before.get(id);
    const a = after.get(id);
    const fromGrade = b?.grade ?? base.estimateInput.conditions[id] ?? null;
    const toGrade = a?.grade ?? conditions[id] ?? null;
    const fromCost = b?.cost ?? 0;
    const toCost = a?.cost ?? 0;
    if (fromGrade !== toGrade || Math.round(fromCost) !== Math.round(toCost))
      changes.push({ process: id, fromGrade, toGrade, fromCost, toCost });
  }
  return {
    estimateInput,
    estimate,
    scenarios: calculateScenarios(revenueInput, total, assumption),
    changes,
  };
}
