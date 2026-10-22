import { describe, expect, it } from "vitest";
import {
  canChangeStatus,
  canManageReservations,
  estimateTotal,
  firstConflict,
  isDate,
  nightsOf,
  parseRequest,
  readBooking,
  todayKst,
} from "./reservation.js";

const booking = { enabled: true, maxGuests: 4, minNights: 1, maxNights: 7 };
const base = {
  branchId: "onkiro-1",
  checkIn: "2026-11-06",
  checkOut: "2026-11-08",
  guests: 2,
  guestName: "김수진",
  phone: "010-1234-5678",
  memo: "",
};
const TODAY = "2026-10-23";

describe("날짜", () => {
  it("묵는 밤은 체크인 날부터 체크아웃 전날까지", () => {
    expect(nightsOf("2026-11-06", "2026-11-08")).toEqual([
      "2026-11-06",
      "2026-11-07",
    ]);
    expect(nightsOf("2026-12-31", "2027-01-01")).toEqual(["2026-12-31"]);
  });

  it("없는 날짜는 거른다", () => {
    expect(isDate("2026-02-30")).toBe(false);
    expect(isDate("2026-11-06")).toBe(true);
  });

  it("한국 날짜는 UTC보다 9시간 빠르다", () => {
    expect(todayKst(new Date("2026-10-22T15:30:00Z"))).toBe("2026-10-23");
  });
});

describe("예상 금액", () => {
  it("금·토요일 밤은 주말 요금", () => {
    // 11/6 금, 11/7 토, 11/8 일
    const nights = nightsOf("2026-11-06", "2026-11-09");
    expect(estimateTotal(nights, { weekday: 150_000, weekend: 200_000 })).toBe(
      550_000,
    );
  });
});

describe("신청 검증", () => {
  it("올바른 신청", () => {
    const r = parseRequest(base, booking, TODAY);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.nights).toHaveLength(2);
  });

  it("예약을 켜지 않은 숙소는 받지 않는다", () => {
    expect(parseRequest(base, { ...booking, enabled: false }, TODAY).ok).toBe(
      false,
    );
  });

  it("오늘·지난 날짜, 180일 넘는 날짜는 받지 않는다", () => {
    expect(parseRequest({ ...base, checkIn: TODAY }, booking, TODAY).ok).toBe(
      false,
    );
    expect(
      parseRequest(
        { ...base, checkIn: "2027-05-01", checkOut: "2027-05-02" },
        booking,
        TODAY,
      ).ok,
    ).toBe(false);
  });

  it("박 수·인원 범위", () => {
    expect(
      parseRequest({ ...base, checkOut: base.checkIn }, booking, TODAY).ok,
    ).toBe(false);
    expect(
      parseRequest({ ...base, checkOut: "2026-11-20" }, booking, TODAY).ok,
    ).toBe(false);
    expect(parseRequest({ ...base, guests: 5 }, booking, TODAY).ok).toBe(false);
    expect(parseRequest({ ...base, guests: 0 }, booking, TODAY).ok).toBe(false);
  });

  it("이름·연락처 필수", () => {
    expect(parseRequest({ ...base, guestName: " " }, booking, TODAY).ok).toBe(
      false,
    );
    expect(parseRequest({ ...base, phone: "abc" }, booking, TODAY).ok).toBe(
      false,
    );
  });
});

describe("막힌 날짜", () => {
  it("겹치는 첫 밤을 알려준다", () => {
    expect(
      firstConflict(["2026-11-06", "2026-11-07"], ["2026-11-07", "2026-11-08"]),
    ).toBe("2026-11-07");
    // 체크아웃 날은 묵지 않으므로 겹치지 않는다
    expect(firstConflict(["2026-11-06", "2026-11-07"], ["2026-11-08"])).toBe(
      null,
    );
  });
});

describe("지점 예약 설정", () => {
  it("없거나 잘못된 값은 기본값, 최대 박 수는 최소 박 수 이상", () => {
    expect(readBooking(undefined)).toEqual({
      enabled: false,
      maxGuests: 4,
      minNights: 1,
      maxNights: 7,
    });
    expect(
      readBooking({
        enabled: true,
        minNights: 3,
        maxNights: 2,
        maxGuests: "6",
      }),
    ).toEqual({ enabled: true, maxGuests: 6, minNights: 3, maxNights: 3 });
  });
});

describe("상태 이동·권한", () => {
  it("운영팀: 확인 중 → 확정·거절·취소, 확정 → 취소", () => {
    expect(canChangeStatus("requested", "confirmed", "staff")).toBe(true);
    expect(canChangeStatus("requested", "rejected", "staff")).toBe(true);
    expect(canChangeStatus("confirmed", "cancelled", "staff")).toBe(true);
    expect(canChangeStatus("confirmed", "rejected", "staff")).toBe(false);
    expect(canChangeStatus("rejected", "confirmed", "staff")).toBe(false);
  });

  it("회원 본인은 확인 중인 신청만 취소", () => {
    expect(canChangeStatus("requested", "cancelled", "owner")).toBe(true);
    expect(canChangeStatus("confirmed", "cancelled", "owner")).toBe(false);
    expect(canChangeStatus("requested", "confirmed", "owner")).toBe(false);
  });

  it("관리자·콘텐츠 편집 권한만 예약을 다룬다", () => {
    expect(canManageReservations({ role: "admin" })).toBe(true);
    expect(
      canManageReservations({ role: "staff", perms: ["canEditContent"] }),
    ).toBe(true);
    expect(
      canManageReservations({ role: "staff", perms: ["canEditPrices"] }),
    ).toBe(false);
    expect(canManageReservations({ role: "member" })).toBe(false);
  });
});
