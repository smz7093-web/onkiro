import { describe, expect, it } from "vitest";
import { ASSUMPTION_V0_3, RECOMMENDED_ASSUMPTION } from "./defaults";
import { REFERENCE_INVESTMENT, REFERENCE_REVENUE } from "./reference";
import {
  calculateRevenue,
  calculateScenarios,
  RevenueInputError,
} from "./revenue";

// 수익 검증표 (prd.md 7.2, task.md 3.4): 총투자금 3,300만 원, 가정값 v0.3 기본값
const TOTAL = 33_000_000;
const man = (won: number) => Math.round(won / 10_000);

describe("수익 엔진 · 검증표 (만 원 단위 반올림 비교)", () => {
  const s = calculateScenarios(
    ASSUMPTION_V0_3.defaults,
    TOTAL,
    ASSUMPTION_V0_3,
  );

  it.each([
    ["conservative", 0.45, 309, 186, 122, 27],
    ["base", 0.6, 411, 217, 195, 17],
    ["optimistic", 0.7, 480, 237, 243, 14],
  ] as const)(
    "%s (가동률 %s)",
    (id, occupancy, revenue, opex, net, payback) => {
      const r = s[id];
      expect(r.occupancy).toBeCloseTo(occupancy, 10);
      expect(man(r.revenue)).toBe(revenue);
      expect(man(r.operatingCost)).toBe(opex);
      expect(man(r.net)).toBe(net);
      expect(Math.round(r.paybackMonths!)).toBe(payback);
    },
  );

  it("BEP 가동률은 세 안 모두 약 20%", () => {
    for (const r of Object.values(s)) {
      expect(Math.round(r.breakEvenOccupancy! * 100)).toBe(20);
    }
  });

  it("기본안 세부 항목", () => {
    const r = s.base;
    expect(r.nightsSold).toBeCloseTo(18, 10);
    expect(r.adr).toBeCloseTo(228_571.43, 1);
    expect(r.cleaningCost).toBeCloseTo(600_000, 0);
    expect(r.fixedCost).toBe(950_000);
  });
});

describe("수익 엔진 · 규칙", () => {
  const input = ASSUMPTION_V0_3.defaults;

  it("차감 후 추정액이 0 이하이면 회수 기간이 없다", () => {
    const r = calculateRevenue(
      { ...input, occupancy: 0.1, rent: 3_000_000 },
      TOTAL,
    );
    expect(r.net).toBeLessThanOrEqual(0);
    expect(r.paybackMonths).toBeNull();
  });

  it("OTA 수수료는 OTA 경유 매출에만 붙는다", () => {
    const r = calculateRevenue({ ...input, otaShare: 0.5 }, TOTAL);
    expect(r.otaFee).toBeCloseTo(r.revenue * 0.5 * 0.15, 6);
  });

  it("판매 불가일은 판매 가능일에서 뺀다", () => {
    const r = calculateRevenue({ ...input, unavailableDays: 2 }, TOTAL);
    expect(r.sellableDays).toBe(28);
    expect(r.nightsSold).toBeCloseTo(28 * 0.6, 10);
  });

  it("기타 초기 투자금은 총투자금에 더한다", () => {
    const r = calculateRevenue(
      { ...input, otherInitialInvestment: 2_000_000 },
      TOTAL,
    );
    expect(r.investment).toBe(35_000_000);
  });

  it("기본안 가동률이 25~85% 밖이면 3안을 계산하지 않는다", () => {
    expect(() =>
      calculateScenarios({ ...input, occupancy: 0.2 }, TOTAL, ASSUMPTION_V0_3),
    ).toThrow(RevenueInputError);
    expect(() =>
      calculateScenarios({ ...input, occupancy: 0.9 }, TOTAL, ASSUMPTION_V0_3),
    ).toThrow(RevenueInputError);
  });

  it("잘못된 입력은 거부한다", () => {
    expect(() =>
      calculateRevenue({ ...input, otaFeeRate: 1.5 }, TOTAL),
    ).toThrow(RevenueInputError);
    expect(() =>
      calculateRevenue({ ...input, unavailableDays: 31 }, TOTAL),
    ).toThrow(RevenueInputError);
    expect(() =>
      calculateRevenue({ ...input, avgStayNights: 0 }, TOTAL),
    ).toThrow(RevenueInputError);
  });
});

describe("10/19 확정 가정값 (관리 화면 수익 검증표와 같아야 한다)", () => {
  it("기본안 월 매출 320만·차감 후 140만·회수 26개월 (가동률 50%)", () => {
    const s = calculateScenarios(
      RECOMMENDED_ASSUMPTION.defaults,
      REFERENCE_INVESTMENT,
      RECOMMENDED_ASSUMPTION,
    );
    for (const id of ["conservative", "base", "optimistic"] as const) {
      const ref = REFERENCE_REVENUE[id];
      expect(Math.round(s[id].revenue / 10_000)).toBe(ref.revenue);
      expect(Math.round(s[id].operatingCost / 10_000)).toBe(ref.operatingCost);
      expect(Math.round(s[id].net / 10_000)).toBe(ref.net);
      expect(Math.round(s[id].paybackMonths!)).toBe(ref.paybackMonths);
      expect(Math.round(s[id].breakEvenOccupancy! * 100)).toBe(ref.bep);
    }
  });
});
