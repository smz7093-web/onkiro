import {
  PROCESS_IDS,
  type ConditionGrade,
  type EstimateInput,
  type EstimateResult,
  type PriceTable,
  type ProcessCost,
  type ProcessId,
  type ProcessPrice,
} from "./types";

// 견적 엔진 (SIM-08, prd.md 7.1).
// ① 기준수량 ② 공정별 비용 = 기본 공사비 + 보수비 × 상태계수 ③ 공정 소계 × 지역계수, 예비비
// ④ 범위 = 합계 × (1 ± 불확실도), 하한 내림·상한 올림
// ⑤ 공기 = 병행 묶음마다 가장 긴 공정 작업일의 합 + 고정일 (v1.2, 석원 확정 10/19)

// 같은 묶음 안의 공정은 함께 진행한다: 철거 → 구조·지붕 → 설비·단열 → 실내(내부·욕실·주방·IoT) → 외부
export const PARALLEL_GROUPS: readonly (readonly ProcessId[])[] = [
  ["demolition"],
  ["structure", "roof"],
  ["electrical", "insulation"],
  ["interior", "bathroom", "kitchen", "iot"],
  ["exterior"],
];

export function scheduleDays(processes: { id: ProcessId; days: number }[]) {
  const daysOf = new Map(processes.map((p) => [p.id, p.days]));
  return PARALLEL_GROUPS.reduce(
    (sum, group) =>
      sum + Math.max(0, ...group.map((id) => daysOf.get(id) ?? 0)),
    0,
  );
}

export class EstimateInputError extends Error {}

// 지붕이 덮는 바닥 면적 = 연면적 ÷ 지상 층수 (층수가 없거나 1 미만이면 1층)
export function roofBaseArea(input: EstimateInput) {
  const floors =
    input.floors && Number.isInteger(input.floors) && input.floors >= 1
      ? input.floors
      : 1;
  return input.floorArea / floors;
}

function quantity(
  price: ProcessPrice,
  input: EstimateInput,
  table: PriceTable,
) {
  switch (price.quantityBasis) {
    case "floorArea":
      return input.floorArea;
    case "roofArea":
      return roofBaseArea(input) * table.roofAreaFactor;
    case "bathrooms":
      return input.bathrooms;
    case "kitchens":
      return input.kitchens;
    case "lumpSum":
      return 1;
  }
}

function validate(input: EstimateInput, table: PriceTable) {
  if (!(input.floorArea > 0))
    throw new EstimateInputError("연면적은 0보다 커야 합니다");
  for (const [k, v] of [
    ["욕실 개수", input.bathrooms],
    ["주방 개수", input.kitchens],
    ["사진 누락 부위 수", input.missingPhotoParts],
    ["모름 응답 수", input.unknownAnswers],
  ] as const) {
    if (!Number.isInteger(v) || v < 0)
      throw new EstimateInputError(`${k}는 0 이상의 정수여야 합니다`);
  }
  if (!(input.region in table.regionFactors)) {
    throw new EstimateInputError(`지역계수가 없는 지역입니다: ${input.region}`);
  }
}

function baseApplies(id: ProcessId, price: ProcessPrice, input: EstimateInput) {
  if (price.baseApplies === "always") return true;
  if (price.baseApplies === "optional")
    return input.optionalBaseWork?.includes(id) ?? false;
  return false;
}

export function calculateEstimate(
  input: EstimateInput,
  table: PriceTable,
): EstimateResult {
  validate(input, table);
  const regionFactor = table.regionFactors[input.region];
  const processes: ProcessCost[] = [];
  const unpricedProcesses: ProcessId[] = [];

  for (const id of PROCESS_IDS) {
    const grade: ConditionGrade = input.conditions[id] ?? "good";
    const price = table.processes[id];
    if (!price) {
      if (grade !== "good") unpricedProcesses.push(id);
      continue;
    }
    const qty = quantity(price, input, table);
    const coefficient = table.conditionCoefficients[grade];
    const withBase = baseApplies(id, price, input);
    const baseUnit =
      id === "interior"
        ? table.moduleUnitPrices[input.module]
        : price.baseUnitPrice;

    const baseCost = withBase ? qty * (baseUnit ?? 0) : 0;
    const repairCost = qty * (price.repairUnitPrice ?? 0) * coefficient;
    // 석면 슬레이트 지붕을 고치면(부분 보수·전면 교체) 처리비를 더한다
    const extraCost =
      id === "roof" && input.slateRoof && grade !== "good"
        ? (table.slateDisposalCost ?? 0)
        : 0;
    const days =
      (withBase ? (price.baseDays ?? 0) : 0) +
      (price.repairDays ?? 0) * coefficient;

    // 기본 공사와 보수가 모두 없는 공정은 생략한다
    if (baseCost === 0 && repairCost === 0 && extraCost === 0 && days === 0)
      continue;
    processes.push({
      id,
      grade,
      baseCost,
      repairCost,
      ...(extraCost > 0 ? { extraCost } : {}),
      cost: (baseCost + repairCost + extraCost) * regionFactor,
      days,
    });
  }

  const subtotal = processes.reduce((sum, p) => sum + p.cost, 0);
  const contingency = subtotal * table.contingencyRate;
  const total = subtotal + contingency;

  const u = table.uncertainty;
  const uncertainty =
    u.base +
    u.perMissingPhotoPart * input.missingPhotoParts +
    (input.noRegistry ? u.noRegistry : 0) +
    u.perUnknownAnswer * input.unknownAnswers;

  const unit = table.rangeRoundingUnit;
  const rangeLow = Math.max(
    0,
    Math.floor((total * (1 - uncertainty)) / unit) * unit,
  );
  const rangeHigh = Math.ceil((total * (1 + uncertainty)) / unit) * unit;

  const days = Math.ceil(scheduleDays(processes)) + table.fixedDays;

  return {
    priceVersion: table.version,
    processes,
    subtotal,
    contingency,
    total,
    uncertainty,
    rangeLow,
    rangeHigh,
    days,
    unpricedProcesses,
  };
}

// 화면·PDF 표시용 반올림 (계산값과 스냅샷에는 쓰지 않는다)
export function roundForDisplay(amount: number, unit = 1_000_000) {
  return Math.round(amount / unit) * unit;
}
