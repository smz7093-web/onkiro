import { describe, expect, it } from "vitest";
import { calculateEstimate } from "../engine/estimate";
import {
  RECOMMENDED_ASSUMPTION,
  RECOMMENDED_PRICE_TABLE,
} from "../engine/defaults";
import { REFERENCE_ESTIMATE_INPUT } from "../engine/reference";
import { applyReview } from "./apply";

const price = RECOMMENDED_PRICE_TABLE;
const base = {
  estimateInput: REFERENCE_ESTIMATE_INPUT,
  estimate: calculateEstimate(REFERENCE_ESTIMATE_INPUT, price),
};
const revenue = RECOMMENDED_ASSUMPTION.defaults;

describe("진단 검수 보정 (ADM-03, 11.4)", () => {
  it("보정이 없으면 원래 견적과 같고 바뀐 공정도 없다", () => {
    const r = applyReview(base, revenue, price, RECOMMENDED_ASSUMPTION, {});
    expect(r.changes).toEqual([]);
    expect(r.estimate.total).toBeCloseTo(base.estimate.total);
  });

  it("금액을 고치면 소계·예비비·합계·범위·3안 수익을 다시 계산한다", () => {
    const p = base.estimate.processes[0];
    const cost = p.cost + 800_000;
    const r = applyReview(base, revenue, price, RECOMMENDED_ASSUMPTION, {
      [p.id]: { cost },
    });
    expect(r.changes).toEqual([
      {
        process: p.id,
        fromGrade: p.grade,
        toGrade: p.grade,
        fromCost: p.cost,
        toCost: cost,
      },
    ]);
    expect(r.estimate.subtotal).toBeCloseTo(base.estimate.subtotal + 800_000);
    expect(r.estimate.total).toBeCloseTo(
      r.estimate.subtotal * (1 + price.contingencyRate),
    );
    expect(r.estimate.rangeHigh).toBeGreaterThanOrEqual(r.estimate.total);
    expect(r.scenarios.base.net).toBeDefined();
  });

  it("판정을 바꾸면 단가 DB로 그 공정을 다시 계산한다", () => {
    const r = applyReview(base, revenue, price, RECOMMENDED_ASSUMPTION, {
      structure: { grade: "full" },
    });
    const auto = calculateEstimate(
      {
        ...REFERENCE_ESTIMATE_INPUT,
        conditions: {
          ...REFERENCE_ESTIMATE_INPUT.conditions,
          structure: "full",
        },
      },
      price,
    );
    expect(r.estimate.total).toBeCloseTo(auto.total);
    expect(r.changes.map((c) => c.process)).toContain("structure");
    expect(r.estimateInput.conditions.structure).toBe("full");
  });

  it("자동 견적에 없던 공정에도 금액을 넣을 수 있다", () => {
    const missing = (["exterior", "demolition", "structure"] as const).find(
      (id) => !base.estimate.processes.some((p) => p.id === id),
    )!;
    const r = applyReview(base, revenue, price, RECOMMENDED_ASSUMPTION, {
      [missing]: { cost: 2_000_000 },
    });
    expect(r.estimate.processes.find((p) => p.id === missing)?.cost).toBe(
      2_000_000,
    );
    expect(r.changes).toHaveLength(1);
  });
});
