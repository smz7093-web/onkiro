import type { EstimateInput } from "./types";

// 검증 사례 (prd.md 7절, task.md 3.4·5.2). 관리 화면에서 버전 값을 바꿨을 때 결과가 기준값과 같은지 보여준다.
// D5·D6로 기준값이 바뀌면 task.md 5.6 절차로 이 값과 PRD를 함께 고친다.
// 10/19: 팀원 확정안(defaults.ts RECOMMENDED_*)과 계산식 v1.2 기준으로 바꿨다 (이전: 3,000만/3,300만/40일, 가동률 60% 기준 수익)

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
  subtotal: 33_000_000,
  total: 37_000_000,
  rangeLow: 31_000_000,
  rangeHigh: 43_000_000,
  days: 25,
};

// 수익 검증표: 총투자금 3,700만 원, 만 원 단위 (BEP는 %). 확정 가정값(가동률 기본 40%, 보수 25%, 낙관 55%)
export const REFERENCE_INVESTMENT = 37_000_000;
export const REFERENCE_REVENUE = {
  conservative: {
    revenue: 160,
    operatingCost: 140,
    net: 20,
    paybackMonths: 186,
    bep: 21,
  },
  base: {
    revenue: 256,
    operatingCost: 164,
    net: 92,
    paybackMonths: 40,
    bep: 21,
  },
  optimistic: {
    revenue: 352,
    operatingCost: 188,
    net: 164,
    paybackMonths: 23,
    bep: 21,
  },
} as const;
