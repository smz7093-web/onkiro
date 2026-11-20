import { describe, expect, it } from "vitest";
import { addYears, isExpired, photoRetention } from "./retention.js";

const d = (s: string) => new Date(s);

describe("진단 사진 보관 기간 (task.md 11.2)", () => {
  it("상담을 신청한 진단은 자동 삭제하지 않는다", () => {
    const r = photoRetention({
      lastUsedAt: d("2020-01-01T00:00:00Z"),
      updatedAt: null,
      createdAt: null,
      hasConsult: true,
    });
    expect(r).toEqual({ kind: "consult" });
    expect(isExpired(r, d("2030-01-01T00:00:00Z"))).toBe(false);
  });

  it("마지막 이용(열기·고치기 중 늦은 날) 후 1년", () => {
    const r = photoRetention({
      lastUsedAt: d("2026-11-20T03:00:00Z"),
      updatedAt: d("2026-10-01T00:00:00Z"),
      createdAt: d("2026-09-01T00:00:00Z"),
      hasConsult: false,
    });
    expect(r?.kind).toBe("expires");
    if (r?.kind !== "expires") return;
    expect(r.at.toISOString()).toBe("2027-11-20T03:00:00.000Z");
    expect(isExpired(r, d("2027-11-20T02:59:59Z"))).toBe(false);
    expect(isExpired(r, d("2027-11-20T03:00:00Z"))).toBe(true);
  });

  it("열어 본 기록이 없으면 고친 날, 그것도 없으면 만든 날", () => {
    const a = photoRetention({
      lastUsedAt: null,
      updatedAt: d("2026-10-01T00:00:00Z"),
      createdAt: d("2026-09-01T00:00:00Z"),
      hasConsult: false,
    });
    expect(a?.kind === "expires" && a.at.toISOString()).toBe(
      "2027-10-01T00:00:00.000Z",
    );
    const b = photoRetention({
      lastUsedAt: null,
      updatedAt: null,
      createdAt: d("2026-09-01T00:00:00Z"),
      hasConsult: false,
    });
    expect(b?.kind === "expires" && b.at.toISOString()).toBe(
      "2027-09-01T00:00:00.000Z",
    );
  });

  it("날짜가 하나도 없으면 판단하지 않는다(지우지 않음)", () => {
    const r = photoRetention({
      lastUsedAt: null,
      updatedAt: null,
      createdAt: null,
      hasConsult: false,
    });
    expect(r).toBeNull();
    expect(isExpired(r, new Date())).toBe(false);
  });

  it("2월 29일 + 1년은 3월 1일", () => {
    expect(addYears(d("2028-02-29T00:00:00Z"), 1).toISOString()).toBe(
      "2029-03-01T00:00:00.000Z",
    );
  });
});
