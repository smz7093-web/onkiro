import { describe, expect, it } from "vitest";
import { formatNumberInput, parseLenientNumber } from "./parse-number";

describe("너그러운 숫자 입력 (포스텔의 법칙)", () => {
  it("쉼표·공백·단위·만 원을 받는다", () => {
    expect(parseLenientNumber("173,600")).toBe(173600);
    expect(parseLenientNumber("17.36만")).toBe(173600);
    expect(parseLenientNumber("250만 원")).toBe(2500000);
    expect(parseLenientNumber(" 15 %")).toBe(15);
    expect(parseLenientNumber("0.4")).toBe(0.4);
    expect(parseLenientNumber("7일")).toBe(7);
  });
  it("빈 칸은 undefined, 읽을 수 없으면 null", () => {
    expect(parseLenientNumber("")).toBeUndefined();
    expect(parseLenientNumber("  ")).toBeUndefined();
    expect(parseLenientNumber("열두")).toBeNull();
    expect(parseLenientNumber("1.2.3")).toBeNull();
  });
  it("보일 때는 천 단위 쉼표", () => {
    expect(formatNumberInput(173600)).toBe("173,600");
    expect(formatNumberInput(0.4)).toBe("0.4");
    expect(formatNumberInput(undefined)).toBe("");
  });
});
