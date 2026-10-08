import { describe, expect, it } from "vitest";
import { canApprove, validateAssumptionSet, validatePriceTable } from "./versions";

// web/src/lib/engine/defaults.ts의 임시 기준값과 같은 내용
const price = {
  version: "v2026.10-1",
  processes: {
    demolition: { quantityBasis: "floorArea", baseUnitPrice: 25000, baseDays: 3, baseApplies: "optional" },
    roof: { quantityBasis: "roofArea", repairUnitPrice: 173600, repairDays: 12 },
    interior: { quantityBasis: "floorArea", baseDays: 15, baseApplies: "always" },
  },
  moduleUnitPrices: { A: 165000, B: 208000, C: 236000 },
  conditionCoefficients: { good: 0, partial: 0.4, full: 1 },
  roofAreaFactor: 1.3,
  contingencyRate: 0.1,
  regionFactors: { hongseong: 1 },
  fixedDays: 5,
  uncertainty: { base: 0.15, perMissingPhotoPart: 0.05, noRegistry: 0.1, perUnknownAnswer: 0 },
  rangeRoundingUnit: 1000000,
};

const assumption = {
  version: "v0.3",
  region: "hongseong",
  defaults: {
    weekdayPrice: 200000,
    weekendPrice: 300000,
    occupancy: 0.6,
    otaFeeRate: 0.15,
    unavailableDays: 0,
    otaShare: 1,
    avgStayNights: 1.5,
    cleaningCostPerTurn: 50000,
    utilities: 300000,
    rent: 500000,
    insuranceMaintenance: 150000,
    ancillaryRate: 0,
    otherInitialInvestment: 0,
  },
  scenarioDeltas: { conservative: -0.15, optimistic: 0.1 },
  occupancyRange: { min: 0.25, max: 0.85 },
  seasonalOccupancy: { peak: 0.8, offPeak: 0.4 },
};

describe("validatePriceTable", () => {
  it("임시 단가표는 통과한다", () => {
    expect(validatePriceTable(price, "v2026.10-1")).toEqual([]);
  });

  it("버전 불일치·모르는 공정·음수 단가를 잡는다", () => {
    const errors = validatePriceTable(
      {
        ...price,
        processes: { ...price.processes, pool: { quantityBasis: "lumpSum" }, roof: { quantityBasis: "roofArea", repairUnitPrice: -1 } },
      },
      "v2026.10-2",
    );
    expect(errors.some((e) => e.includes("version"))).toBe(true);
    expect(errors.some((e) => e.includes("pool"))).toBe(true);
    expect(errors.some((e) => e.includes("roof.repairUnitPrice"))).toBe(true);
  });

  it("상태계수 순서가 뒤집히면 거부한다", () => {
    const errors = validatePriceTable(
      { ...price, conditionCoefficients: { good: 0, partial: 0.8, full: 0.5 } },
      "v2026.10-1",
    );
    expect(errors).toContain("상태계수는 양호 ≤ 부분 ≤ 전면이어야 합니다");
  });
});

describe("validateAssumptionSet", () => {
  it("임시 가정값은 통과한다", () => {
    expect(validateAssumptionSet(assumption, "v0.3")).toEqual([]);
  });

  it("3안이 10~95%를 벗어나게 하는 범위는 거부한다", () => {
    const errors = validateAssumptionSet(
      { ...assumption, occupancyRange: { min: 0.2, max: 0.9 } },
      "v0.3",
    );
    expect(errors.some((e) => e.includes("보수안"))).toBe(true);
    expect(errors.some((e) => e.includes("낙관안"))).toBe(true);
  });

  it("기본 가동률이 입력 범위 밖이면 거부한다", () => {
    const errors = validateAssumptionSet(
      { ...assumption, defaults: { ...assumption.defaults, occupancy: 0.9 } },
      "v0.3",
    );
    expect(errors).toContain("기본 가동률이 입력 범위 밖입니다");
  });

  it("빠진 입력값을 잡는다", () => {
    const { rent: _rent, ...rest } = assumption.defaults;
    const errors = validateAssumptionSet({ ...assumption, defaults: rest }, "v0.3");
    expect(errors.some((e) => e.startsWith("rent"))).toBe(true);
  });
});

describe("canApprove", () => {
  it("관리자와 canApproveVersions 운영팀만 적용할 수 있다", () => {
    expect(canApprove({ role: "admin" })).toBe(true);
    expect(canApprove({ role: "staff", perms: ["canApproveVersions"] })).toBe(true);
    expect(canApprove({ role: "staff", perms: ["canEditPrices"] })).toBe(false);
    expect(canApprove({ role: "member", perms: ["canApproveVersions"] })).toBe(false);
    expect(canApprove(undefined)).toBe(false);
  });
});
