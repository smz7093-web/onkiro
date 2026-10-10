import { describe, expect, it } from "vitest";
import { evaluateChecklist, worse, type ChecklistAnswers } from "./checklist";

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

// 예시 테스트. D4 매핑표의 행마다 이런 테스트를 하나씩 추가한다 (석원, task.md 3.7).
describe("체크리스트 · D4 매핑", () => {
  it.each([
    ["usable", "good"],
    ["partial", "partial"],
    ["full", "full"],
  ] as const)("욕실 '%s' → %s", (answer, grade) => {
    expect(
      evaluateChecklist({ ...OK, bathroom: answer }).conditions.bathroom,
    ).toBe(grade);
  });

  it.todo("비가 샌다 → 지붕 ?");
  it.todo("손가락 들어갈 정도의 금 → 구조 보강 전면 + 위험 신호 majorCrack");
  it.todo("많이 기울어짐 → 위험 신호 severeTilt");
});
