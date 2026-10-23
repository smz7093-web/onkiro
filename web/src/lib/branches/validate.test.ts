import { describe, expect, it } from "vitest";
import { SAMPLE_BRANCHES } from "./sample";
import {
  isBranchId,
  normalizeBranch,
  validateBranch,
  type BranchDraft,
} from "./validate";

const sample = SAMPLE_BRANCHES[0];
const draft: BranchDraft = {
  name: sample.name,
  content: {
    ...sample.content,
    photos: [{ url: "https://example.com/a.jpg", caption: "마당" }],
  },
  airbnbUrl: null,
  naverUrl: null,
};

describe("숙소 id", () => {
  it("영문 소문자·숫자·하이픈만", () => {
    expect(isBranchId("hongseong-1")).toBe(true);
    expect(isBranchId("홍성1")).toBe(false);
    expect(isBranchId("Hongseong")).toBe(false);
    expect(isBranchId("a")).toBe(false);
  });
});

describe("홈 카드 사진", () => {
  it("목록에 있는 사진만 남기고, 없으면 필드를 지운다", () => {
    const url = "https://example.com/a.jpg";
    const keep = normalizeBranch({
      ...draft,
      content: { ...draft.content, homePhotoUrl: url },
    });
    expect(keep.content.homePhotoUrl).toBe(url);
    const gone = normalizeBranch({
      ...draft,
      content: { ...draft.content, homePhotoUrl: "https://example.com/x.jpg" },
    });
    expect("homePhotoUrl" in gone.content).toBe(false);
    const unset = normalizeBranch({
      ...draft,
      content: { ...draft.content, homePhotoUrl: undefined },
    });
    expect("homePhotoUrl" in unset.content).toBe(false);
  });
});

describe("숙소 콘텐츠 검사", () => {
  it("정상 콘텐츠는 통과", () => {
    expect(validateBranch(draft)).toEqual([]);
  });

  it("예약 신청 설정: 인원·박 수 범위, 최대 박 수 ≥ 최소 박 수", () => {
    const booking = {
      enabled: true,
      maxGuests: 4,
      baseGuests: 4,
      extraGuestFee: 0,
      minNights: 1,
      maxNights: 7,
      paymentGuide: "",
      policy: "",
    };
    const withBooking = (b: Partial<typeof booking>) => ({
      ...draft,
      content: { ...draft.content, booking: { ...booking, ...b } },
    });
    expect(validateBranch(withBooking({}))).toEqual([]);
    expect(validateBranch(withBooking({ maxGuests: 0 }))).toHaveLength(1);
    expect(
      validateBranch(
        withBooking({ maxGuests: 8, baseGuests: 6, extraGuestFee: 20_000 }),
      ),
    ).toEqual([]);
    expect(
      validateBranch(withBooking({ maxGuests: 8, baseGuests: 9 })),
    ).toHaveLength(1);
    expect(
      validateBranch(withBooking({ minNights: 3, maxNights: 2 })),
    ).toHaveLength(1);
  });

  it("예약 링크는 https만", () => {
    expect(
      validateBranch({ ...draft, airbnbUrl: "http://airbnb.com/x" }),
    ).toHaveLength(1);
    expect(
      validateBranch({ ...draft, naverUrl: "https://booking.naver.com/x" }),
    ).toEqual([]);
  });

  it("사진 설명·시각 형식을 검사한다", () => {
    const bad = {
      ...draft,
      content: {
        ...draft.content,
        photos: [{ url: "https://x/a.jpg", caption: " " }],
        price: { ...draft.content.price, checkIn: "3시" },
      },
    };
    expect(validateBranch(bad)).toHaveLength(2);
  });

  it("빈 링크는 null, 빈 편의시설은 지운다", () => {
    const n = normalizeBranch({
      ...draft,
      airbnbUrl: "  ",
      content: {
        ...draft.content,
        amenities: ["소화기", " ", " 연기 감지기 "],
      },
    });
    expect(n.airbnbUrl).toBeNull();
    expect(n.content.amenities).toEqual(["소화기", "연기 감지기"]);
  });
});
