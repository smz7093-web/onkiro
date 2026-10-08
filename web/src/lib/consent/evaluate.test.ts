import { describe, expect, it } from "vitest";
import type { ConsentItem } from "./definitions";
import { evaluateConsents, type ConsentRecord } from "./evaluate";

const items: ConsentItem[] = [
  { type: "terms", required: true, version: "v2", label: "", detail: "" },
  { type: "privacy", required: true, version: "v1", label: "", detail: "" },
  { type: "photoModel", required: false, version: "v1", label: "", detail: "" },
];

const at = (day: number) => new Date(2026, 9, day);
const rec = (
  type: ConsentRecord["type"],
  version: string,
  agreed: boolean,
  day: number,
): ConsentRecord => ({ type, version, agreed, agreedAt: at(day) });

describe("evaluateConsents", () => {
  it("기록이 없으면 필수 항목이 모두 빠져 있다", () => {
    const s = evaluateConsents([], items);
    expect(s.complete).toBe(false);
    expect(s.missingRequired).toEqual(["terms", "privacy"]);
    expect(s.outdatedRequired).toEqual([]);
    expect(s.optional).toEqual({ photoModel: false });
  });

  it("필수 항목을 현재 버전으로 모두 동의하면 완료다", () => {
    const s = evaluateConsents(
      [rec("terms", "v2", true, 1), rec("privacy", "v1", true, 1)],
      items,
    );
    expect(s.complete).toBe(true);
    expect(s.missingRequired).toEqual([]);
  });

  it("필수 약관이 개정되면 재동의가 필요하다", () => {
    const s = evaluateConsents(
      [rec("terms", "v1", true, 1), rec("privacy", "v1", true, 1)],
      items,
    );
    expect(s.complete).toBe(false);
    expect(s.missingRequired).toEqual(["terms"]);
    expect(s.outdatedRequired).toEqual(["terms"]);
  });

  it("선택 동의는 가장 최근 기록을 따른다 (철회 반영)", () => {
    const s = evaluateConsents(
      [
        rec("terms", "v2", true, 1),
        rec("privacy", "v1", true, 1),
        rec("photoModel", "v1", true, 1),
        rec("photoModel", "v1", false, 5),
      ],
      items,
    );
    expect(s.complete).toBe(true);
    expect(s.optional).toEqual({ photoModel: false });
  });
});
