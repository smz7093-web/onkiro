import type { AssumptionSet, PriceTable } from "./types";

// 임시 기준값. 단가는 목업 adm-price-db, 가정값은 MVP_기능명세서.md 5절 기준이다.
// D5(석원)·D6(원일)이 오면 task.md 5.6 절차로 새 버전을 만들고, 이 값은 시드(seed/)와 테스트용으로만 남긴다.

export const PRICE_V2026_10_1: PriceTable = {
  version: "v2026.10-1",
  processes: {
    // TODO(D4·D5): 철거를 넣는 조건 확인 전까지 optional (대표 예시 공정 소계 3,000만 원에는 철거가 없다)
    demolition: {
      quantityBasis: "floorArea",
      baseUnitPrice: 25_000,
      baseDays: 3,
      baseApplies: "optional",
    },
    roof: {
      quantityBasis: "roofArea",
      repairUnitPrice: 173_600,
      repairDays: 12,
    },
    structure: {
      quantityBasis: "floorArea",
      repairUnitPrice: 104_200,
      repairDays: 8,
    },
    bathroom: {
      quantityBasis: "bathrooms",
      repairUnitPrice: 2_500_000,
      repairDays: 6,
    },
    kitchen: {
      quantityBasis: "kitchens",
      repairUnitPrice: 2_000_000,
      repairDays: 5,
    },
    // 기본 단가는 moduleUnitPrices
    interior: {
      quantityBasis: "floorArea",
      baseDays: 15,
      baseApplies: "always",
    },
    iot: {
      quantityBasis: "lumpSum",
      baseUnitPrice: 1_000_000,
      baseDays: 1,
      baseApplies: "always",
    },
  },
  moduleUnitPrices: { A: 165_000, B: 208_000, C: 236_000 },
  conditionCoefficients: { good: 0, partial: 0.4, full: 1.0 },
  roofAreaFactor: 1.3,
  contingencyRate: 0.1,
  regionFactors: { hongseong: 1.0 },
  fixedDays: 5,
  uncertainty: {
    base: 0.15,
    perMissingPhotoPart: 0.05,
    noRegistry: 0.1,
    // TODO(D5): "모름" 응답 가산 폭 미정. 확정 전까지 0으로 두어 결과를 바꾸지 않는다
    perUnknownAnswer: 0,
  },
  rangeRoundingUnit: 1_000_000,
};

export const ASSUMPTION_V0_3: AssumptionSet = {
  version: "v0.3",
  region: "hongseong",
  defaults: {
    weekdayPrice: 200_000,
    weekendPrice: 300_000,
    occupancy: 0.6,
    otaFeeRate: 0.15,
    unavailableDays: 0,
    otaShare: 1,
    avgStayNights: 1.5,
    cleaningCostPerTurn: 50_000,
    utilities: 300_000,
    rent: 500_000,
    insuranceMaintenance: 150_000,
    ancillaryRate: 0,
    otherInitialInvestment: 0,
  },
  scenarioDeltas: { conservative: -0.15, optimistic: 0.1 },
  occupancyRange: { min: 0.25, max: 0.85 },
  seasonalOccupancy: { peak: 0.8, offPeak: 0.4 },
};
