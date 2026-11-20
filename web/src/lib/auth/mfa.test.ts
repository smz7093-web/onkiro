import { describe, expect, it, vi } from "vitest";

// firebase 클라이언트 초기화 없이 순수 함수만 시험한다
vi.mock("../firebase/client", () => ({
  auth: {},
  functions: {},
  USE_EMULATORS: false,
}));

const { normalizeTotpCode, mfaErrorMessage } = await import("./mfa");
const { FirebaseError } = await import("firebase/app");

describe("2단계 인증 입력 (task.md 11.3)", () => {
  it("숫자만 6자리까지 남긴다", () => {
    expect(normalizeTotpCode("123 456")).toBe("123456");
    expect(normalizeTotpCode("12-34-567")).toBe("123456");
    expect(normalizeTotpCode("abc")).toBe("");
  });

  it("틀린 숫자는 다시 넣으라고 안내한다", () => {
    expect(
      mfaErrorMessage(new FirebaseError("auth/invalid-verification-code", "x")),
    ).toContain("다시");
    expect(
      mfaErrorMessage(new FirebaseError("auth/operation-not-allowed", "x")),
    ).toContain("PM");
  });
});
