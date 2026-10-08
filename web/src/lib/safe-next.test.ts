import { describe, expect, it } from "vitest";
import { safeNextPath } from "./safe-next";

describe("safeNextPath", () => {
  it("앱 내부 경로는 그대로 쓴다", () => {
    expect(safeNextPath("/diagnose/address")).toBe("/diagnose/address");
  });
  it("외부 주소·프로토콜 상대 주소·스크립트는 기본 경로로 바꾼다", () => {
    expect(safeNextPath("https://evil.example")).toBe("/");
    expect(safeNextPath("//evil.example")).toBe("/");
    expect(safeNextPath(String.raw`/\evil.example`)).toBe("/");
    expect(safeNextPath("javascript:alert(1)")).toBe("/");
    expect(safeNextPath(null, "/me")).toBe("/me");
  });
});
