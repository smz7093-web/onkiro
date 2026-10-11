import { describe, expect, it } from "vitest";
import {
  DEFAULT_CHECKLIST_RULES,
  evaluateChecklist,
  uncoveredAnswers,
  worse,
  type ChecklistAnswers,
  type ChecklistRule,
} from "./checklist";

// 모든 답이 "문제 없음"인 기본 답안. 테스트마다 바꿀 문항만 덮어쓴다.
const OK: ChecklistAnswers = {
  leak: "no",
  water: "yes",
  power: "yes",
  septic: "yes",
  lastOccupied: "within1y",
  crack: "none",
  tilt: "no",
  bathroom: "usable",
  kitchen: "usable",
  heating: "oil",
};

describe("체크리스트 · 공통", () => {
  it("모름 답 개수를 센다", () => {
    const r = evaluateChecklist({ ...OK, leak: "unknown", septic: "unknown" });
    expect(r.unknownAnswers).toBe(2);
  });

  it("두 상태 중 더 나쁜 쪽을 고른다", () => {
    expect(worse("partial", "good")).toBe("partial");
    expect(worse("partial", "full")).toBe("full");
    expect(worse(undefined, "good")).toBe("good");
  });
});

describe("체크리스트 · 기본 판정표", () => {
  it.each([
    ["usable", "good"],
    ["partial", "partial"],
    ["full", "full"],
  ] as const)("욕실 '%s' → %s", (answer, grade) => {
    expect(
      evaluateChecklist({ ...OK, bathroom: answer }).conditions.bathroom,
    ).toBe(grade);
  });

  it("손가락 들어갈 정도의 금 → 위험 신호 '큰 균열'", () => {
    const r = evaluateChecklist({ ...OK, crack: "wide" });
    expect(r.riskFlags).toEqual([
      {
        id: "majorCrack",
        reason: "벽이나 기둥에 금이 간 곳이 있나요? → 손가락 들어갈 정도",
      },
    ]);
  });

  it("많이 기울어짐 → 위험 신호 '심한 기울어짐', 조금은 아님", () => {
    expect(evaluateChecklist({ ...OK, tilt: "severe" }).riskFlags[0]?.id).toBe(
      "severeTilt",
    );
    expect(evaluateChecklist({ ...OK, tilt: "slight" }).riskFlags).toEqual([]);
  });
});

describe("체크리스트 · 관리자 판정표 적용 (task.md 3.7)", () => {
  const rules: ChecklistRule[] = [
    {
      question: "leak",
      answer: "yes",
      process: "roof",
      grade: "partial",
      risk: null,
    },
    {
      question: "crack",
      answer: "wide",
      process: "structure",
      grade: "full",
      risk: "majorCrack",
    },
    {
      question: "crack",
      answer: "hairline",
      process: "structure",
      grade: "partial",
      risk: null,
    },
    {
      question: "tilt",
      answer: "slight",
      process: "structure",
      grade: "partial",
      risk: null,
    },
  ];

  it("답과 맞는 줄만 적용한다", () => {
    const r = evaluateChecklist({ ...OK, leak: "yes" }, rules);
    expect(r.conditions).toEqual({ roof: "partial" });
    expect(r.riskFlags).toEqual([]);
  });

  it("한 공정에 여러 줄이 걸리면 가장 나쁜 판정", () => {
    const r = evaluateChecklist(
      { ...OK, crack: "wide", tilt: "slight" },
      rules,
    );
    expect(r.conditions.structure).toBe("full");
    expect(r.riskFlags.map((f) => f.id)).toEqual(["majorCrack"]);
  });

  it("판정표에 없는 답을 찾는다", () => {
    const missing = uncoveredAnswers(rules);
    expect(missing).toContainEqual({ question: "leak", answer: "no" });
    expect(missing).not.toContainEqual({ question: "leak", answer: "yes" });
    expect(uncoveredAnswers(DEFAULT_CHECKLIST_RULES)).toContainEqual({
      question: "leak",
      answer: "yes",
    });
  });
});
