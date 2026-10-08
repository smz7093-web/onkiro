import type {
  AssumptionSet,
  RevenueInput,
  RevenueResult,
  ScenarioId,
} from "./types";

// 수익 시뮬레이터 (SIM-12·14, prd.md 7.2). 연평균 가정값으로 대표 월 하나를 계산한다.

export class RevenueInputError extends Error {}

const DAYS_PER_MONTH = 30;

function validate(input: RevenueInput) {
  const nonNegative: [string, number][] = [
    ["평일가", input.weekdayPrice],
    ["주말가", input.weekendPrice],
    ["회당 청소비", input.cleaningCostPerTurn],
    ["공과금", input.utilities],
    ["임차료", input.rent],
    ["보험·유지보수", input.insuranceMaintenance],
    ["기타 초기 투자금", input.otherInitialInvestment],
  ];
  for (const [name, v] of nonNegative) {
    if (!(v >= 0)) throw new RevenueInputError(`${name}은 0 이상이어야 합니다`);
  }
  const ratios: [string, number][] = [
    ["가동률", input.occupancy],
    ["OTA 수수료율", input.otaFeeRate],
    ["OTA 경유 비중", input.otaShare],
    ["부가매출 비율", input.ancillaryRate],
  ];
  for (const [name, v] of ratios) {
    if (!(v >= 0 && v <= 1))
      throw new RevenueInputError(`${name}은 0~100% 사이여야 합니다`);
  }
  if (!(
    input.unavailableDays >= 0 && input.unavailableDays <= DAYS_PER_MONTH
  )) {
    throw new RevenueInputError("판매 불가일은 0~30일이어야 합니다");
  }
  if (!(input.avgStayNights >= 1)) {
    throw new RevenueInputError("평균 숙박일수는 1박 이상이어야 합니다");
  }
}

export function calculateRevenue(
  input: RevenueInput,
  estimateTotal: number,
  scenario: ScenarioId = "base",
): RevenueResult {
  validate(input);
  const sellableDays = DAYS_PER_MONTH - input.unavailableDays;
  const nightsSold = sellableDays * input.occupancy;
  const adr = (input.weekdayPrice * 5) / 7 + (input.weekendPrice * 2) / 7;
  const revenue = nightsSold * adr * (1 + input.ancillaryRate);

  const otaFee = revenue * input.otaShare * input.otaFeeRate;
  const cleaningCost =
    (nightsSold / input.avgStayNights) * input.cleaningCostPerTurn;
  const variableCost = otaFee + cleaningCost;
  const fixedCost = input.utilities + input.rent + input.insuranceMaintenance;
  const operatingCost = variableCost + fixedCost;
  const net = revenue - operatingCost;

  const investment = estimateTotal + input.otherInitialInvestment;
  const paybackMonths = net > 0 ? investment / net : null;

  const contributionPerNight =
    adr * (1 + input.ancillaryRate) * (1 - input.otaShare * input.otaFeeRate) -
    input.cleaningCostPerTurn / input.avgStayNights;
  const breakEvenOccupancy =
    contributionPerNight > 0 && sellableDays > 0
      ? fixedCost / (sellableDays * contributionPerNight)
      : null;

  return {
    scenario,
    occupancy: input.occupancy,
    sellableDays,
    nightsSold,
    adr,
    revenue,
    otaFee,
    cleaningCost,
    variableCost,
    fixedCost,
    operatingCost,
    net,
    investment,
    paybackMonths,
    breakEvenOccupancy,
  };
}

// 3안 비교: 가동률만 바꾸고 나머지는 같다 (SIM-14).
// 기본안 가동률은 occupancyRange 안이어야 보수안·낙관안이 10~95%를 벗어나지 않는다.
export function calculateScenarios(
  input: RevenueInput,
  estimateTotal: number,
  assumptions: Pick<AssumptionSet, "scenarioDeltas" | "occupancyRange">,
): Record<ScenarioId, RevenueResult> {
  const { min, max } = assumptions.occupancyRange;
  if (input.occupancy < min || input.occupancy > max) {
    throw new RevenueInputError(
      `기본안 가동률은 ${Math.round(min * 100)}~${Math.round(max * 100)}% 사이여야 합니다`,
    );
  }
  const { conservative, optimistic } = assumptions.scenarioDeltas;
  const at = (occupancy: number, id: ScenarioId) =>
    calculateRevenue({ ...input, occupancy }, estimateTotal, id);
  return {
    conservative: at(input.occupancy + conservative, "conservative"),
    base: at(input.occupancy, "base"),
    optimistic: at(input.occupancy + optimistic, "optimistic"),
  };
}
