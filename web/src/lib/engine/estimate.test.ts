import { describe, expect, it } from "vitest";
import { PRICE_V2026_10_1, RECOMMENDED_PRICE_TABLE } from "./defaults";
import { REFERENCE_ESTIMATE, REFERENCE_ESTIMATE_INPUT } from "./reference";
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

describe("견적 엔진 · 층수 (계산식 v1.1)", () => {
  it("2층이면 지붕 면적이 절반, 다른 공정은 그대로", () => {
    const one = calculateEstimate(representative, PRICE_V2026_10_1);
    const two = calculateEstimate(
      { ...representative, floors: 2 },
      PRICE_V2026_10_1,
    );
    expect(costOf(two, "roof")).toBeCloseTo(costOf(one, "roof") / 2, 0);
    expect(costOf(two, "interior")).toBeCloseTo(costOf(one, "interior"), 0);
  });

  it("층수가 없거나 0이면 1층으로 본다", () => {
    const one = calculateEstimate(representative, PRICE_V2026_10_1);
    const zero = calculateEstimate(
      { ...representative, floors: 0 },
      PRICE_V2026_10_1,
    );
    expect(costOf(zero, "roof")).toBeCloseTo(costOf(one, "roof"), 0);
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

  // v1.2 병행: 구조·지붕 max(3.2, 4.8) + 실내 max(15, 6, 5, 1) = 19.8 → 20 + 고정 5 (v1.1은 단순 합 40일)
  it("공기 25일 (v1.2 병행 묶음)", () => {
    expect(r.days).toBe(25);
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
    // 내부·IoT는 같은 묶음 → 15 + 고정 5
    expect(r.days).toBe(15 + 5);
  });

  it("철거를 고르면 기본 공사비와 작업일이 더해진다", () => {
    const r = calculateEstimate(
      { ...representative, optionalBaseWork: ["demolition"] },
      PRICE_V2026_10_1,
    );
    expect(costOf(r, "demolition")).toBeCloseTo(72 * 25_000, 0);
    // 철거 3 + 구조·지붕 4.8 + 실내 15 = 22.8 → 23 + 고정 5
    expect(r.days).toBe(28);
  });

  it("v1.2: 석면 슬레이트 지붕을 고치면 처리비, 지붕이 양호면 더하지 않는다", () => {
    const table = { ...PRICE_V2026_10_1, slateDisposalCost: 3_000_000 };
    const fix = calculateEstimate(
      { ...representative, slateRoof: true },
      table,
    );
    const base = calculateEstimate(representative, table);
    expect(costOf(fix, "roof") - costOf(base, "roof")).toBeCloseTo(
      3_000_000,
      0,
    );
    const good = calculateEstimate(
      { ...representative, slateRoof: true, conditions: {} },
      table,
    );
    expect(good.processes.some((p) => p.id === "roof")).toBe(false);
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

describe("10/19 확정안 대표 예시 (관리 화면 검증 사례와 같아야 한다)", () => {
  it("확정 단가·v1.2로 소계 3,300만·합계 3,700만·범위 3,100~4,300만·25일", () => {
    const r = calculateEstimate(
      REFERENCE_ESTIMATE_INPUT,
      RECOMMENDED_PRICE_TABLE,
    );
    expect(roundForDisplay(r.subtotal)).toBe(REFERENCE_ESTIMATE.subtotal);
    expect(roundForDisplay(r.total)).toBe(REFERENCE_ESTIMATE.total);
    expect(r.rangeLow).toBe(REFERENCE_ESTIMATE.rangeLow);
    expect(r.rangeHigh).toBe(REFERENCE_ESTIMATE.rangeHigh);
    expect(r.days).toBe(REFERENCE_ESTIMATE.days);
  });
});
