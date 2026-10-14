import { describe, expect, it } from "vitest";
import { permitItems, purposeSignal, roadSignal } from "./permits";

describe("인허가 간이 확인 · 대장 주용도·도로 접면 (10/14)", () => {
  it("주택이면 신호 없음, 주택이 아니면 '확인 필요'", () => {
    expect(purposeSignal("단독주택")).toBeNull();
    expect(purposeSignal(null)).toBeNull();
    expect(purposeSignal("창고시설")).toMatchObject({
      id: "mainPurpose",
      status: "check",
    });
  });

  it("맹지·차량 통행 불가 길만 신호, 통행 가능 길은 없음", () => {
    expect(roadSignal("세로한면(가)")).toBeNull();
    expect(roadSignal("맹지")?.title).toContain("맹지");
    expect(roadSignal("세로(불)")?.title).toContain("차량 통행");
  });

  it("신호는 기본 항목 앞에, '가능'이라는 표현은 쓰지 않는다", () => {
    const items = permitItems(false, {
      mainPurpose: "축사",
      roadSide: "맹지",
    });
    expect(items.slice(0, 2).map((i) => i.id)).toEqual([
      "mainPurpose",
      "roadSide",
    ]);
    expect(items.every((i) => i.status === "check")).toBe(true);
    expect(items.some((i) => /가능합니다|허가 가능/.test(i.title))).toBe(false);
  });

  it("예전 스냅샷(site 없음)은 기존 3항목 그대로", () => {
    expect(permitItems(false).map((i) => i.id)).toEqual([
      "ruralHomestay",
      "hanokExperience",
      "zoning",
    ]);
  });
});
