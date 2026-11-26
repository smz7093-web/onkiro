import { describe, expect, it } from "vitest";
import {
  DEFAULT_SOCIAL_VALUE,
  isPhotoUrl,
  readSocialValue,
  validateSocialValue,
} from "./social-value";

describe("사회적 가치 페이지 문구 (11/26)", () => {
  it("저장한 적이 없으면 초안이고 꺼져 있다", () => {
    const v = readSocialValue(undefined);
    expect(v.enabled).toBe(false);
    expect(v.items.length).toBeGreaterThan(0);
    expect(validateSocialValue(v)).toEqual([]);
  });

  it("켜기는 true일 때만, 빈 사업은 뺀다", () => {
    const v = readSocialValue({
      enabled: "yes",
      mission: "미션",
      items: [
        { title: "a", body: "b" },
        { title: "", body: "" },
      ],
    });
    expect(v.enabled).toBe(false);
    expect(v.items).toEqual([{ title: "a", body: "b" }]);
  });

  it("미션은 필수, '사회적기업 인증' 표현은 막는다", () => {
    expect(
      validateSocialValue({ ...DEFAULT_SOCIAL_VALUE, mission: " " }),
    ).toContain("미션 문구를 입력하세요.");
    expect(
      validateSocialValue({
        ...DEFAULT_SOCIAL_VALUE,
        designation: "사회적기업 인증을 받았습니다",
      }).join(" "),
    ).toContain("인증");
    expect(
      validateSocialValue({
        ...DEFAULT_SOCIAL_VALUE,
        designation: "2026년 11월 18일 예비사회적기업 지정",
      }),
    ).toEqual([]);
  });

  it("예전에 저장한 문서에 새 칸이 없으면 기본값을 쓴다", () => {
    const v = readSocialValue({ enabled: true, mission: "m", items: [] });
    expect(v.vision).toBe(DEFAULT_SOCIAL_VALUE.vision);
    expect(v.goals).toEqual(DEFAULT_SOCIAL_VALUE.goals);
    expect(v.activities.length).toBeGreaterThan(0);
    expect(v.items).toEqual([]);
  });

  it("사진 주소는 사이트 경로나 https만 받는다", () => {
    expect(isPhotoUrl("/social/education-1.jpg")).toBe(true);
    expect(isPhotoUrl("https://example.com/a.jpg")).toBe(true);
    expect(isPhotoUrl("javascript:alert(1)")).toBe(false);
    expect(isPhotoUrl("http://example.com/a.jpg")).toBe(false);
    const bad = structuredClone(DEFAULT_SOCIAL_VALUE);
    bad.activities[0].photos[0].url = "javascript:alert(1)";
    expect(validateSocialValue(bad).join(" ")).toContain("사진 1");
  });

  it("기본 사진 파일이 public/social에 있다", async () => {
    const { existsSync } = await import("node:fs");
    for (const a of DEFAULT_SOCIAL_VALUE.activities)
      for (const p of a.photos)
        expect(existsSync(`public${p.url}`), p.url).toBe(true);
  });
});
