// 운영팀 토큰은 2단계 인증(TOTP)으로 로그인한 것이어야 한다 (task.md 11.3).
// 실제 카카오 + TOTP 로그인 토큰의 firebase 항목과 같은 모양. 테스트 컨텍스트 옵션에 펼쳐 넣는다.
export const MFA = {
  firebase: {
    sign_in_provider: "oidc.kakao",
    sign_in_second_factor: "totp",
  },
} as Record<string, unknown>;

// 2단계 인증 없이 카카오로만 로그인한 토큰
export const NO_MFA = {
  firebase: { sign_in_provider: "oidc.kakao" },
} as Record<string, unknown>;

// 로컬 에뮬레이터 시드 계정 (비밀번호 로그인 + devMfaBypass)
export const DEV_BYPASS = {
  firebase: { sign_in_provider: "password" },
  devMfaBypass: true,
} as Record<string, unknown>;
