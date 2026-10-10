import { describe, expect, it } from "vitest";
import {
  editFact,
  initialFacts,
  manualFact,
  missingRequired,
  parseFactInput,
  type Fact,
} from "./facts";
import { advanceReached, canOpen, nextStep, prevStep } from "./steps";

const fetched: Fact = {
  value: 72,
  source: "buildingRegistry",
  fetchedAt: "2026-10-13T05:02:00.000Z",
  userEdited: false,
  originalValue: null,
};

describe("기본 정보 수정 (SIM-05)", () => {
  it("조회값을 고치면 원래 값을 보관한다", () => {
    const f = editFact(fetched, 80);
    expect(f).toMatchObject({ value: 80, userEdited: true, originalValue: 72 });
    expect(f.source).toBe("buildingRegistry");
  });

  it("여러 번 고쳐도 원래 값은 처음 조회값이다", () => {
    const f = editFact(editFact(fetched, 80), 85);
    expect(f.originalValue).toBe(72);
  });

  it("조회값으로 되돌리면 수정 표시를 지운다", () => {
    const f = editFact(editFact(fetched, 80), 72);
    expect(f).toMatchObject({
      value: 72,
      userEdited: false,
      originalValue: null,
    });
  });

  it("직접 입력한 값은 그냥 바뀐다", () => {
    expect(editFact(manualFact(1), 2)).toEqual(manualFact(2));
    expect(editFact(undefined, "목구조")).toEqual(manualFact("목구조"));
  });
});

describe("입력 값 해석", () => {
  it.each([
    ["area", "72.5", 72.5],
    ["won", "48,200", 48200],
    ["count", "2", 2],
    ["area", "", null],
    ["area", "abc", null],
    ["area", "-3", null],
    ["text", " 목구조 ", "목구조"],
  ] as const)("%s '%s' → %s", (kind, raw, expected) => {
    expect(parseFactInput(kind, raw)).toBe(expected);
  });
});

describe("필수 값", () => {
  it("처음에는 연면적만 비어 있다 (욕실·주방은 1개로 시작)", () => {
    expect(missingRequired(initialFacts())).toEqual(["floorArea"]);
  });

  it("연면적은 0보다 커야 하고, 욕실 0개는 허용한다", () => {
    const facts = {
      ...initialFacts(),
      floorArea: manualFact(0),
      bathrooms: manualFact(0),
    };
    expect(missingRequired(facts)).toEqual(["floorArea"]);
    expect(missingRequired({ ...facts, floorArea: manualFact(72) })).toEqual(
      [],
    );
  });
});

describe("진단 단계", () => {
  it("다음·이전 단계", () => {
    expect(nextStep("address")).toBe("confirm");
    expect(prevStep("address")).toBeNull();
    expect(nextStep("revenue")).toBeNull();
  });

  it("도달한 단계까지만 열 수 있다", () => {
    expect(canOpen("confirm", "photos")).toBe(true);
    expect(canOpen("checklist", "photos")).toBe(false);
  });

  it("뒤로 돌아가 고쳐도 도달 단계는 줄지 않는다", () => {
    expect(advanceReached("address", "address")).toBe("confirm");
    expect(advanceReached("checklist", "address")).toBe("checklist");
  });
});
