import { describe, expect, it } from "vitest";
import { PRICE_V2026_10_1 } from "./defaults";
import {
  calculateEstimate,
  EstimateInputError,
  roundForDisplay,
} from "./estimate";
import type { EstimateInput } from "./types";

// 대표 예시 (prd.md 7.1, task.md 3.4): 시나리오 1 진단 DX-1003-014
const representative: EstimateInput = {
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

const costOf = (r: ReturnType<typeof calculateEstimate>, id: string) =>
  r.processes.find((p) => p.id === id)?.cost ?? 0;

describe("견적 엔진 · 대표 예시 ① 계산값 (원 단위)", () => {
  const r = calculateEstimate(representative, PRICE_V2026_10_1);

  it("공정별 비용", () => {
    expect(costOf(r, "roof")).toBeCloseTo(6_499_584, 0);
    expect(costOf(r, "structure")).toBeCloseTo(3_000_960, 0);
    expect(costOf(r, "interior")).toBeCloseTo(14_976_000, 0);
    expect(costOf(r, "bathroom") + costOf(r, "kitchen")).toBeCloseTo(
      4_500_000,
      0,
    );
    expect(costOf(r, "iot")).toBeCloseTo(1_000_000, 0);
  });

  it("철거는 조건 확인 전까지 넣지 않는다", () => {
    expect(r.processes.map((p) => p.id)).not.toContain("demolition");
  });

  it("소계·합계·계산 범위", () => {
    expect(r.subtotal).toBeCloseTo(29_976_544, 0);
    expect(r.total).toBeCloseTo(32_974_198.4, 0);
    expect(r.total * (1 - r.uncertainty)).toBeCloseTo(28_028_068.64, 0);
    expect(r.total * (1 + r.uncertainty)).toBeCloseTo(37_920_328.16, 0);
    expect(r.uncertainty).toBeCloseTo(0.15, 10);
  });

  it("버전을 함께 돌려준다", () => {
    expect(r.priceVersion).toBe("v2026.10-1");
  });
});

describe("견적 엔진 · 대표 예시 ② 표시값", () => {
  const r = calculateEstimate(representative, PRICE_V2026_10_1);

  it("공정 소계 3,000만 원, 합계 3,300만 원", () => {
    expect(roundForDisplay(r.subtotal)).toBe(30_000_000);
    expect(roundForDisplay(r.total)).toBe(33_000_000);
  });

  it("범위 2,800만~3,800만 원 (하한 내림, 상한 올림)", () => {
    expect(r.rangeLow).toBe(28_000_000);
    expect(r.rangeHigh).toBe(38_000_000);
  });

  it("공기 40일", () => {
    expect(r.days).toBe(40);
  });
});

describe("견적 엔진 · 규칙", () => {
  it("상태계수는 보수비에만 곱한다: 전부 양호면 기본 공사만 남는다", () => {
    const r = calculateEstimate(
      { ...representative, conditions: {} },
      PRICE_V2026_10_1,
    );
    expect(r.processes.map((p) => p.id)).toEqual(["interior", "iot"]);
    expect(r.subtotal).toBeCloseTo(14_976_000 + 1_000_000, 0);
    expect(r.days).toBe(15 + 1 + 5);
  });

  it("철거를 고르면 기본 공사비와 작업일이 더해진다", () => {
    const r = calculateEstimate(
      { ...representative, optionalBaseWork: ["demolition"] },
      PRICE_V2026_10_1,
    );
    expect(costOf(r, "demolition")).toBeCloseTo(72 * 25_000, 0);
    expect(r.days).toBe(43);
  });

  it("사진 누락·대장 없음은 불확실도를 넓힌다", () => {
    const r = calculateEstimate(
      { ...representative, missingPhotoParts: 2, noRegistry: true },
      PRICE_V2026_10_1,
    );
    expect(r.uncertainty).toBeCloseTo(0.15 + 0.1 + 0.1, 10);
    expect(r.rangeLow).toBe(Math.floor((r.total * 0.65) / 1e6) * 1e6);
    expect(r.rangeHigh).toBe(Math.ceil((r.total * 1.35) / 1e6) * 1e6);
  });

  it("지역계수는 공정 비용에 곱한다", () => {
    const table = {
      ...PRICE_V2026_10_1,
      regionFactors: { ...PRICE_V2026_10_1.regionFactors, test: 1.1 },
    };
    const base = calculateEstimate(representative, PRICE_V2026_10_1);
    const r = calculateEstimate({ ...representative, region: "test" }, table);
    expect(r.subtotal).toBeCloseTo(base.subtotal * 1.1, 0);
  });

  it("단가가 없는 공정에 상태 판정이 있으면 따로 알린다", () => {
    const r = calculateEstimate(
      {
        ...representative,
        conditions: { ...representative.conditions, electrical: "full" },
      },
      PRICE_V2026_10_1,
    );
    expect(r.unpricedProcesses).toEqual(["electrical"]);
  });

  it("잘못된 입력은 거부한다", () => {
    expect(() =>
      calculateEstimate({ ...representative, floorArea: 0 }, PRICE_V2026_10_1),
    ).toThrow(EstimateInputError);
    expect(() =>
      calculateEstimate({ ...representative, bathrooms: -1 }, PRICE_V2026_10_1),
    ).toThrow(EstimateInputError);
    expect(() =>
      calculateEstimate(
        { ...representative, region: "seoul" },
        PRICE_V2026_10_1,
      ),
    ).toThrow(EstimateInputError);
  });
});
