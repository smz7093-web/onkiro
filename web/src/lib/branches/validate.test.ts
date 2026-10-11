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

describe("숙소 콘텐츠 검사", () => {
  it("정상 콘텐츠는 통과", () => {
    expect(validateBranch(draft)).toEqual([]);
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
