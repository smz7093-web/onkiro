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

// 대표 주소 1 — 홍성읍 오관리 595-1 (10/20 PM 지정, functions/src/external/demo-fixtures.ts와 같은 대장 값)
const FACTS_1: Facts = {
  floorArea: manualFact(90.59),
  floors: manualFact(1),
  structure: manualFact("조적조(벽돌·블록)"),
  roofStructure: manualFact("기와"),
  approvalDate: manualFact("1976-10-28"),
  mainPurpose: manualFact("단독주택"),
  roadSide: manualFact("소로한면"),
};

// 시연에서 고르는 답 (대본의 '시연 답변' 표와 같아야 한다). PM이 10/19 검토 사이트에서 이 집으로 고른 답
const DEMO_ANSWERS_1: ChecklistAnswers = {
  leak: "yes",
  roofHole: "no",
  water: "yes",
  power: "yes",
  septic: "yes",
  lastOccupied: "5to10y",
  crack: "hairline",
  tilt: "no",
  bathroom: "partial",
  kitchen: "partial",
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

describe("시연 대본 금액 · 대표 주소 1 오관리 595-1 (확정 기준값)", () => {
  const c = computeEstimate(
    inputs(FACTS_1, DEMO_ANSWERS_1),
    RECOMMENDED_PRICE_TABLE,
  );

  it("판정: 지붕·구조·설비·단열·욕실·주방 부분 보수 → 철거 자동 포함(빈 지 5~10년), 위험 신호 없음", () => {
    expect(c.checklist.conditions).toEqual({
      roof: "partial",
      structure: "partial",
      electrical: "partial",
      insulation: "partial",
      bathroom: "partial",
      kitchen: "partial",
    });
    expect(c.estimateInput.optionalBaseWork).toEqual(["demolition"]);
    expect(c.expertRequired).toBe(false);
  });

  it("중(표준형): 합계 약 5,000만, 범위 4,200~5,800만, 공기 31일", () => {
    expect(roundForDisplay(c.estimate.total)).toBe(50_000_000);
    expect(c.estimate.rangeLow).toBe(42_000_000);
    expect(c.estimate.rangeHigh).toBe(58_000_000);
    expect(c.estimate.days).toBe(31);
  });

  it("필수 사진이 한 부위 빠지면 범위가 3,900~6,000만으로 넓어진다", () => {
    const m = computeEstimate(
      { ...inputs(FACTS_1, DEMO_ANSWERS_1), missingPhotoParts: 1 },
      RECOMMENDED_PRICE_TABLE,
    );
    expect([m.estimate.rangeLow, m.estimate.rangeHigh]).toEqual([
      39_000_000, 60_000_000,
    ]);
  });

  it("하·상: 약 4,600만(3,800~5,300만) / 약 5,300만(4,400~6,100만)", () => {
    const t = tierEstimates(c.estimateInput, RECOMMENDED_PRICE_TABLE);
    expect(roundForDisplay(t.A.total)).toBe(46_000_000);
    expect([t.A.rangeLow, t.A.rangeHigh]).toEqual([38_000_000, 53_000_000]);
    expect(roundForDisplay(t.C.total)).toBe(53_000_000);
    expect([t.C.rangeLow, t.C.rangeHigh]).toEqual([44_000_000, 61_000_000]);
  });

  it("수익 3안: 기본안 월 매출 320만·차감 후 140만·회수 약 36개월", () => {
    const s = computeScenarios(
      defaultRevenueInput(RECOMMENDED_ASSUMPTION),
      c.estimate.total,
      RECOMMENDED_ASSUMPTION,
    );
    expect(man(s.base.revenue)).toBe(320);
    expect(man(s.base.net)).toBe(140);
    expect(Math.round(s.base.paybackMonths!)).toBe(36);
    expect(man(s.conservative.net)).toBe(68);
    expect(Math.round(s.conservative.paybackMonths!)).toBe(74);
    expect(man(s.optimistic.net)).toBe(212);
    expect(Math.round(s.optimistic.paybackMonths!)).toBe(24);
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

  it("'비가 새는 곳 → 예'만으로는 위험 신호가 뜨지 않는다 (10/18 초안 판정표의 잘못된 줄, 10/20 발견)", () => {
    const c = computeEstimate(
      inputs(FACTS_1, DEMO_ANSWERS_1),
      RECOMMENDED_PRICE_TABLE,
    );
    expect(c.checklist.riskFlags).toEqual([]);
  });
});
