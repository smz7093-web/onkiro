import { describe, expect, it } from "vitest";
import type { ChecklistAnswers } from "../engine/checklist";
import {
  RECOMMENDED_ASSUMPTION,
  RECOMMENDED_PRICE_TABLE,
} from "../engine/defaults";
import { roundForDisplay } from "../engine/estimate";
import {
  computeEstimate,
  computeScenarios,
  defaultRevenueInput,
  tierEstimates,
  type DiagnosisInputs,
} from "./compute";
import { manualFact, type Facts } from "./facts";

// 시연 대본(시연대본.md '시연 답변'·장면 7·8)의 금액이 확정 기준값(RECOMMENDED_*)·계산식과 맞는지 지킨다 (10/19).
// 기준값이나 계산식을 바꿔 이 테스트가 깨지면 시연대본.md의 금액도 함께 고친다.

// 대표 주소 1 — 광천읍 상정리 628 (functions/src/external/demo-fixtures.ts와 같은 대장 값)
const FACTS_1: Facts = {
  floorArea: manualFact(60.76),
  floors: manualFact(1),
  structure: manualFact("목구조"),
  roofStructure: manualFact("금속(강판)"),
  mainPurpose: manualFact("단독주택"),
  roadSide: manualFact("세로한면(가)"),
};

// 시연에서 고르는 답 (대본의 '시연 답변' 표와 같아야 한다)
const DEMO_ANSWERS_1: ChecklistAnswers = {
  leak: "yes",
  roofHole: "no",
  water: "yes",
  power: "yes",
  septic: "yes",
  lastOccupied: "1to5y",
  crack: "hairline",
  tilt: "no",
  bathroom: "full",
  kitchen: "full",
  heating: "oil",
};

const inputs = (
  facts: Facts,
  checklist: ChecklistAnswers,
): DiagnosisInputs => ({
  facts,
  noRegistry: false,
  checklist,
  // 필수 사진 8부위를 모두 올린다
  missingPhotoParts: 0,
  options: { module: "B", demolition: false, exterior: false },
  region: "hongseong",
});

const man = (won: number) => Math.round(won / 10_000);

describe("시연 대본 금액 · 대표 주소 1 (확정 기준값)", () => {
  const c = computeEstimate(
    inputs(FACTS_1, DEMO_ANSWERS_1),
    RECOMMENDED_PRICE_TABLE,
  );

  it("판정: 지붕·구조 부분 보수, 욕실·주방 전면 교체 → 철거 자동 포함, 위험 신호 없음", () => {
    expect(c.checklist.conditions).toEqual({
      roof: "partial",
      structure: "partial",
      bathroom: "full",
      kitchen: "full",
    });
    expect(c.estimateInput.optionalBaseWork).toEqual(["demolition"]);
    expect(c.expertRequired).toBe(false);
  });

  it("중(표준형): 합계 약 3,500만, 범위 2,900~4,100만, 공기 28일", () => {
    expect(roundForDisplay(c.estimate.total)).toBe(35_000_000);
    expect(c.estimate.rangeLow).toBe(29_000_000);
    expect(c.estimate.rangeHigh).toBe(41_000_000);
    expect(c.estimate.days).toBe(28);
  });

  it("하·상: 약 3,200만(2,700~3,700만) / 약 3,700만(3,100~4,300만)", () => {
    const t = tierEstimates(c.estimateInput, RECOMMENDED_PRICE_TABLE);
    expect(roundForDisplay(t.A.total)).toBe(32_000_000);
    expect([t.A.rangeLow, t.A.rangeHigh]).toEqual([27_000_000, 37_000_000]);
    expect(roundForDisplay(t.C.total)).toBe(37_000_000);
    expect([t.C.rangeLow, t.C.rangeHigh]).toEqual([31_000_000, 43_000_000]);
  });

  it("수익 3안: 기본안 월 매출 320만·차감 후 140만·회수 약 25개월", () => {
    const s = computeScenarios(
      defaultRevenueInput(RECOMMENDED_ASSUMPTION),
      c.estimate.total,
      RECOMMENDED_ASSUMPTION,
    );
    expect(man(s.base.revenue)).toBe(320);
    expect(man(s.base.net)).toBe(140);
    expect(Math.round(s.base.paybackMonths!)).toBe(25);
    expect(man(s.conservative.net)).toBe(68);
    expect(Math.round(s.conservative.paybackMonths!)).toBe(52);
    expect(man(s.optimistic.net)).toBe(212);
    expect(Math.round(s.optimistic.paybackMonths!)).toBe(17);
  });
});

describe("시연 대본 · 예비 진단 ② 대표 주소 2 (위험 신호 예시)", () => {
  it("균열 '손가락 들어갈 정도'면 큰 균열 위험 신호 → 현장진단 우선", () => {
    const facts: Facts = {
      floorArea: manualFact(87.1),
      floors: manualFact(1),
      structure: manualFact("조적조(벽돌·블록)"),
      roofStructure: manualFact("기와"),
    };
    const c = computeEstimate(
      inputs(facts, { ...DEMO_ANSWERS_1, crack: "wide" }),
      RECOMMENDED_PRICE_TABLE,
    );
    expect(c.expertRequired).toBe(true);
    expect(c.checklist.riskFlags.map((f) => f.id)).toContain("majorCrack");
  });
});
