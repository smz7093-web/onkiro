import {
  DEFAULT_CHECKLIST_RULES,
  RECOMMENDED_CHECKLIST_RULES,
} from "./checklist";
import type {
  AssumptionSet,
  PriceTable,
  ProcessId,
  ProcessPrice,
} from "./types";

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
  // 체크리스트 판정표 (D4 전 기본값: 욕실·주방, 위험 신호 2개)
  checklistRules: DEFAULT_CHECKLIST_RULES,
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

// D5 단가 (10/19 석원 확정, 팀원결정권장안.md). 관리 화면 '빈 공정에 권장 단가 채우기'가 비어 있는 공정에만 넣는다.
export const RECOMMENDED_PROCESS_PRICES: Partial<
  Record<ProcessId, ProcessPrice>
> = {
  // 외벽 내단열 + 창호 교체 기준, 연면적 ㎡당
  insulation: {
    quantityBasis: "floorArea",
    repairUnitPrice: 120_000,
    repairDays: 7,
  },
  // 배선·분전반·급배수·보일러, 연면적 ㎡당
  electrical: {
    quantityBasis: "floorArea",
    repairUnitPrice: 80_000,
    repairDays: 7,
  },
  // 마당 정리·데크·담장 일부, 1식 (선택 공사)
  exterior: {
    quantityBasis: "lumpSum",
    baseUnitPrice: 5_000_000,
    baseDays: 5,
    baseApplies: "optional",
  },
};

// 단가 DB 확정안 전체 (10/19). 관리 화면 '확정안 전체 불러오기'로 초안에 넣고 PM이 적용한다
export const RECOMMENDED_PRICE_TABLE: PriceTable = {
  ...PRICE_V2026_10_1,
  version: "recommended-2026-10-19",
  processes: {
    ...PRICE_V2026_10_1.processes,
    // 폐기물 운반·처리 포함
    demolition: {
      quantityBasis: "floorArea",
      baseUnitPrice: 35_000,
      baseDays: 3,
      baseApplies: "optional",
    },
    bathroom: {
      quantityBasis: "bathrooms",
      repairUnitPrice: 4_500_000,
      repairDays: 6,
    },
    kitchen: {
      quantityBasis: "kitchens",
      repairUnitPrice: 3_500_000,
      repairDays: 5,
    },
    ...RECOMMENDED_PROCESS_PRICES,
  },
  uncertainty: { ...PRICE_V2026_10_1.uncertainty, perUnknownAnswer: 0.03 },
  slateDisposalCost: 3_000_000,
  checklistRules: RECOMMENDED_CHECKLIST_RULES,
};

// D6 가정값 확정안 (10/19 원일 확정). 관리 화면 '확정안 불러오기'로 새 초안에 넣고 PM이 적용한다
export const RECOMMENDED_ASSUMPTION: AssumptionSet = {
  ...ASSUMPTION_V0_3,
  version: "recommended-2026-10-19",
  defaults: {
    ...ASSUMPTION_V0_3.defaults,
    occupancy: 0.4,
    otaShare: 0.7,
    utilities: 350_000,
    unavailableDays: 2,
  },
  scenarioDeltas: { conservative: -0.15, optimistic: 0.15 },
};
