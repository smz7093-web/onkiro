// 견적·수익 계산 엔진의 입력·출력 타입 (prd.md 7절, task.md 3.1).
// 이 폴더는 React·Firebase를 import하지 않는다. 브라우저와 Cloud Functions가 같은 코드를 쓴다.
// 금액 단위는 원(KRW). 계산값은 반올림하지 않고, 표시용 값만 따로 반올림한다 (prd.md 7.3).

// 공정 분류 (prd.md 7.1). 단가가 없는 공정(단열·창호, 전기·설비, 외부·조경)은 D5에서 채운다.
export const PROCESS_IDS = [
  "demolition",
  "roof",
  "structure",
  "insulation",
  "electrical",
  "bathroom",
  "kitchen",
  "interior",
  "exterior",
  "iot",
] as const;
export type ProcessId = (typeof PROCESS_IDS)[number];

export const PROCESS_LABELS: Record<ProcessId, string> = {
  demolition: "철거",
  roof: "지붕",
  structure: "구조 보강",
  insulation: "단열·창호",
  electrical: "전기·설비",
  bathroom: "욕실",
  kitchen: "주방",
  interior: "내부 리모델링",
  exterior: "외부·조경",
  iot: "IoT 패키지",
};

// 공정 상태 판정: 양호 / 부분 보수 / 전면 교체
export type ConditionGrade = "good" | "partial" | "full";

export type ModuleType = "A" | "B" | "C";

// 기준수량: 연면적(㎡), 지붕면적(연면적 × 계수), 개수(욕실·주방), 1식
export type QuantityBasis =
  "floorArea" | "roofArea" | "bathrooms" | "kitchens" | "lumpSum";

export interface ProcessPrice {
  quantityBasis: QuantityBasis;
  // 기본 공사 단가. 내부 리모델링은 모듈 단가(moduleUnitPrices)를 쓴다
  baseUnitPrice?: number;
  // 상태별 보수 단가 (상태계수를 곱한다)
  repairUnitPrice?: number;
  baseDays?: number;
  repairDays?: number;
  // always: 상태와 무관하게 항상 하는 기본 공사 / optional: 입력에서 고른 경우만 (예: 철거, 조건 확인 중)
  baseApplies?: "always" | "optional";
}

// 단가 DB 한 버전 (ADM-01, Firestore priceVersions/{version}.data)
export interface PriceTable {
  version: string;
  processes: Partial<Record<ProcessId, ProcessPrice>>;
  moduleUnitPrices: Record<ModuleType, number>;
  conditionCoefficients: Record<ConditionGrade, number>;
  roofAreaFactor: number;
  contingencyRate: number;
  regionFactors: Record<string, number>;
  fixedDays: number;
  uncertainty: {
    base: number;
    perMissingPhotoPart: number;
    noRegistry: number;
    perUnknownAnswer: number;
  };
  // 범위 반올림 단위 (원)
  rangeRoundingUnit: number;
}

export interface EstimateInput {
  floorArea: number;
  bathrooms: number;
  kitchens: number;
  module: ModuleType;
  region: string;
  // 체크리스트·검수로 정한 공정별 상태. 없으면 양호로 본다
  conditions: Partial<Record<ProcessId, ConditionGrade>>;
  // baseApplies가 optional인 공정 중 이번 견적에 넣을 것
  optionalBaseWork?: ProcessId[];
  missingPhotoParts: number;
  noRegistry: boolean;
  unknownAnswers: number;
}

export interface ProcessCost {
  id: ProcessId;
  grade: ConditionGrade;
  baseCost: number;
  repairCost: number;
  // (기본 + 보수) × 지역계수
  cost: number;
  days: number;
}

export interface EstimateResult {
  priceVersion: string;
  processes: ProcessCost[];
  subtotal: number;
  contingency: number;
  total: number;
  uncertainty: number;
  rangeLow: number;
  rangeHigh: number;
  days: number;
  // 상태 판정이 있는데 단가가 없는 공정 (D5 전까지 견적에서 빠진다)
  unpricedProcesses: ProcessId[];
}

// 수익 시뮬레이터 입력 13개 (prd.md 7.2, SIM-12)
export interface RevenueInput {
  weekdayPrice: number;
  weekendPrice: number;
  // 0~1
  occupancy: number;
  otaFeeRate: number;
  unavailableDays: number;
  otaShare: number;
  avgStayNights: number;
  cleaningCostPerTurn: number;
  utilities: number;
  rent: number;
  insuranceMaintenance: number;
  ancillaryRate: number;
  otherInitialInvestment: number;
}

// 가정값 한 버전 (ADM-02, Firestore assumptionVersions/{version}.data)
export interface AssumptionSet {
  version: string;
  region: string;
  defaults: RevenueInput;
  // 3안 가동률 편차 (보수 −15%p, 낙관 +10%p)
  scenarioDeltas: { conservative: number; optimistic: number };
  // 기본안 가동률 입력 범위 (prd.md SIM-14)
  occupancyRange: { min: number; max: number };
  // 근거 표시용 (계산에는 쓰지 않는다)
  seasonalOccupancy?: { peak: number; offPeak: number };
}

export type ScenarioId = "conservative" | "base" | "optimistic";

export interface RevenueResult {
  scenario: ScenarioId;
  occupancy: number;
  sellableDays: number;
  nightsSold: number;
  adr: number;
  revenue: number;
  otaFee: number;
  cleaningCost: number;
  variableCost: number;
  fixedCost: number;
  operatingCost: number;
  net: number;
  investment: number;
  // 차감 후 추정액이 0 이하이면 null (화면에 "회수 불가")
  paybackMonths: number | null;
  breakEvenOccupancy: number | null;
}
