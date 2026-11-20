import { describe, expect, it } from "vitest";
import { effectiveToken, hasStaffMfa, isStaffRole } from "./mfa.js";

// 보안 규칙(tests/rules/mfa.rules.test.ts)과 같은 판정인지 확인한다 (task.md 11.3)
const totp = { sign_in_provider: "oidc.kakao", sign_in_second_factor: "totp" };
const kakaoOnly = { sign_in_provider: "oidc.kakao" };

describe("hasStaffMfa", () => {
  it("TOTP 2단계 로그인만 인정한다", () => {
    expect(hasStaffMfa({ firebase: totp })).toBe(true);
    expect(hasStaffMfa({ firebase: kakaoOnly })).toBe(false);
    expect(
      hasStaffMfa({
        firebase: { ...kakaoOnly, sign_in_second_factor: "phone" },
      }),
    ).toBe(false);
    expect(hasStaffMfa({})).toBe(false);
    expect(hasStaffMfa(undefined)).toBe(false);
  });

  it("에뮬레이터 예외는 비밀번호 로그인 + devMfaBypass일 때만", () => {
    expect(
      hasStaffMfa({
        firebase: { sign_in_provider: "password" },
        devMfaBypass: true,
      }),
    ).toBe(true);
    expect(hasStaffMfa({ firebase: kakaoOnly, devMfaBypass: true })).toBe(
      false,
    );
    expect(hasStaffMfa({ firebase: { sign_in_provider: "password" } })).toBe(
      false,
    );
  });
});

describe("effectiveToken", () => {
  it("2단계 인증 없는 운영팀 토큰은 member로 바꾼다", () => {
    const t = {
      role: "admin",
      firebase: kakaoOnly,
      perms: ["canEditPrices"],
    };
    expect(effectiveToken(t).role).toBe("member");
    expect(t.role).toBe("admin"); // 원본은 그대로
    expect(
      effectiveToken({ role: "staff", consultAccess: "all", firebase: {} })
        .role,
    ).toBe("member");
  });

  it("2단계 인증 로그인과 일반 회원은 그대로 둔다", () => {
    const admin = { role: "admin", firebase: totp };
    expect(effectiveToken(admin)).toBe(admin);
    const member = { role: "member", firebase: kakaoOnly };
    expect(effectiveToken(member)).toBe(member);
    const none = { firebase: kakaoOnly };
    expect(effectiveToken(none)).toBe(none);
  });

  it("isStaffRole", () => {
    expect(isStaffRole({ role: "staff" })).toBe(true);
    expect(isStaffRole({ role: "admin" })).toBe(true);
    expect(isStaffRole({ role: "member" })).toBe(false);
    expect(isStaffRole(undefined)).toBe(false);
  });
});
