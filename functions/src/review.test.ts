import { describe, expect, it } from "vitest";
import { canReview, parseReview } from "./review.js";

const valid = {
  assessmentId: "abcDEF123",
  baseSnapshotId: "snap1",
  note: "균열 사진 없음, 보강 범위 상향",
  conditions: { structure: "partial" },
  estimate: {
    processes: [
      { id: "roof", grade: "partial", cost: 6_500_000, days: 12 },
      { id: "structure", grade: "partial", cost: 3_800_000, days: 8 },
    ],
    subtotal: 10_300_000,
    contingency: 1_030_000,
    total: 11_330_000,
    rangeLow: 9_000_000,
    rangeHigh: 13_000_000,
  },
  scenarios: {
    conservative: { net: 1 },
    base: { net: 2 },
    optimistic: { net: 3 },
  },
  changes: [
    {
      process: "structure",
      fromGrade: "partial",
      toGrade: "partial",
      fromCost: 3_000_000,
      toCost: 3_800_000,
    },
  ],
};

describe("진단 검수 권한 (11.4)", () => {
  it("관리자와 진단 보정 권한이 있는 운영팀만", () => {
    expect(canReview({ role: "admin" })).toBe(true);
    expect(canReview({ role: "staff", perms: ["canReviewDiagnosis"] })).toBe(
      true,
    );
    expect(canReview({ role: "staff", perms: ["canEditPrices"] })).toBe(false);
    expect(canReview({ role: "member" })).toBe(false);
    expect(canReview(undefined)).toBe(false);
  });
});

describe("진단 검수 입력 검사 (11.4)", () => {
  it("올바른 보정은 통과한다", () => {
    const r = parseReview(valid);
    expect(r.action).toBe("correct");
    expect(r.changes).toHaveLength(1);
  });
  it("보정 사유는 필수", () => {
    expect(() => parseReview({ ...valid, note: " " })).toThrow("사유");
  });
  it("합계가 공정 합과 다르면 막는다", () => {
    expect(() =>
      parseReview({
        ...valid,
        estimate: { ...valid.estimate, subtotal: 1 },
      }),
    ).toThrow("합계");
  });
  it("바뀐 공정이 없으면 보정이 아니라 확인을 쓰게 한다", () => {
    expect(() => parseReview({ ...valid, changes: [] })).toThrow("그대로");
  });
  it("모르는 공정·판정은 막는다", () => {
    expect(() =>
      parseReview({ ...valid, conditions: { pool: "full" } }),
    ).toThrow("판정");
  });
  it("자동 견적 그대로 확인은 사유 없이도 된다", () => {
    const r = parseReview({
      assessmentId: "abcDEF123",
      baseSnapshotId: "snap1",
      action: "confirm",
    });
    expect(r.action).toBe("confirm");
    expect(r.estimate).toBeUndefined();
  });
});
