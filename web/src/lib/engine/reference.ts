import type { EstimateInput } from "./types";

// 검증 사례 (prd.md 7절, task.md 3.4·5.2). 관리 화면에서 버전 값을 바꿨을 때 결과가 기준값과 같은지 보여준다.
// D5·D6로 기준값이 바뀌면 task.md 5.6 절차로 이 값과 PRD를 함께 고친다.

// 대표 예시: 시나리오 1 진단 DX-1003-014
export const REFERENCE_ESTIMATE_INPUT: EstimateInput = {
  floorArea: 72,
  bathrooms: 1,
  kitchens: 1,
  module: "B",
  region: "hongseong",
  conditions: {
    roof: "partial",
    structure: "partial",
    bathroom: "full",
    kitchen: "full",
  },
  missingPhotoParts: 0,
  noRegistry: false,
  unknownAnswers: 0,
};

export const REFERENCE_ESTIMATE = {
  subtotal: 30_000_000,
  total: 33_000_000,
  rangeLow: 28_000_000,
  rangeHigh: 38_000_000,
  days: 40,
};

// 수익 검증표: 총투자금 3,300만 원, 만 원 단위 (BEP는 %)
export const REFERENCE_INVESTMENT = 33_000_000;
export const REFERENCE_REVENUE = {
  conservative: {
    revenue: 309,
    operatingCost: 186,
    net: 122,
    paybackMonths: 27,
    bep: 20,
  },
  base: {
    revenue: 411,
    operatingCost: 217,
    net: 195,
    paybackMonths: 17,
    bep: 20,
  },
  optimistic: {
    revenue: 480,
    operatingCost: 237,
    net: 243,
    paybackMonths: 14,
    bep: 20,
  },
} as const;
