import { describe, expect, it } from "vitest";
import { PRICE_V2026_10_1 } from "../engine/defaults";
import { buildTodo, splitDrafts } from "./todo";

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

describe("적용 대기 초안 vs 남겨진 초안 (10/19)", () => {
  it("적용 중 버전보다 먼저 만든 초안은 할 일이 아니다", () => {
    const applied = new Date("2026-10-19T12:00:00");
    const r = splitDrafts(
      [
        { id: "v0.4", createdAt: new Date("2026-10-19T09:00:00") },
        { id: "v0.5", createdAt: new Date("2026-10-19T10:00:00") },
        { id: "v0.7", createdAt: new Date("2026-10-19T13:00:00") },
      ],
      applied,
    );
    expect(r).toEqual({ pending: ["v0.7"], stale: ["v0.4", "v0.5"] });
    const items = buildTodo({
      activePrice: null,
      priceDrafts: [],
      assumptionDrafts: [],
      staleAssumptionDrafts: ["v0.4", "v0.5"],
      permitsSaved: true,
      photoGuidesSaved: true,
      branchCount: 2,
      receivedConsults: null,
    });
    const a = items.find((i) => i.id === "assumptionDraft")!;
    expect(a.done).toBe(true);
    expect(a.text).toContain("v0.4, v0.5은 지워도 됩니다");
  });
});
