import { describe, expect, it } from "vitest";
import { PRICE_V2026_10_1 } from "../engine/defaults";
import { buildTodo } from "./todo";

describe("관리자 '아직 할 일'", () => {
  it("임시 기준값 그대로면 단가·판정표·문구가 남은 일로 나온다", () => {
    const items = buildTodo({
      activePrice: PRICE_V2026_10_1,
      priceDrafts: ["v2026.10-5"],
      assumptionDrafts: [],
      permitsSaved: false,
      photoGuidesSaved: false,
      branchCount: 1,
      receivedConsults: 2,
    });
    expect(items.filter((i) => !i.done).map((i) => i.id)).toEqual([
      "consults",
      "priceDraft",
      "priceProcesses",
      "rules",
      "permits",
      "photoGuides",
      "branches",
    ]);
    expect(items.find((i) => i.id === "priceDraft")!.href).toBe(
      "/admin/prices/v2026.10-5",
    );
  });

  it("상담을 볼 권한이 없으면 상담 줄은 없다", () => {
    const items = buildTodo({
      activePrice: null,
      priceDrafts: [],
      assumptionDrafts: [],
      permitsSaved: true,
      photoGuidesSaved: true,
      branchCount: 2,
      receivedConsults: null,
    });
    expect(items.some((i) => i.id === "consults")).toBe(false);
  });
});
