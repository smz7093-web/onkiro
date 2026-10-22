import { describe, expect, it } from "vitest";
import {
  estimateTotal,
  firstConflict,
  monthCells,
  nightsOf,
  readBooking,
  shortDate,
} from "./rules";

describe("예약 날짜·금액", () => {
  it("금·토 밤은 주말 요금으로 더한다", () => {
    const nights = nightsOf("2026-11-06", "2026-11-09");
    expect(nights).toEqual(["2026-11-06", "2026-11-07", "2026-11-08"]);
    expect(estimateTotal(nights, { weekday: 150_000, weekend: 200_000 })).toBe(
      550_000,
    );
  });

  it("체크아웃 날은 막혀 있어도 겹치지 않는다", () => {
    const nights = nightsOf("2026-11-06", "2026-11-08");
    expect(firstConflict(nights, new Set(["2026-11-08"]))).toBe(null);
    expect(firstConflict(nights, new Set(["2026-11-07"]))).toBe("2026-11-07");
  });

  it("2026년 11월 달력은 일요일 시작, 1일은 일요일", () => {
    const cells = monthCells(2026, 11);
    expect(cells[0]).toBe("2026-11-01");
    expect(cells.length % 7).toBe(0);
    expect(cells.filter(Boolean)).toHaveLength(30);
  });

  it("날짜 표시", () => {
    expect(shortDate("2026-11-06")).toBe("11월 6일(금)");
  });

  it("설정이 없으면 예약 꺼짐", () => {
    expect(readBooking(undefined).enabled).toBe(false);
    expect(readBooking({ enabled: true, paymentGuide: "농협" })).toMatchObject({
      enabled: true,
      paymentGuide: "농협",
    });
  });
});
