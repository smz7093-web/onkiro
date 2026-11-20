// 관리자 2단계 인증 강제 (task.md 11.3, prd.md 2절).
// firestore.rules·storage.rules의 staffMfaOk()·role()과 같은 규칙: 2단계 인증(TOTP)으로 로그인하지 않은
// staff·admin 토큰은 일반 회원(member)으로 본다. 모든 callable은 index.ts의 onCall 감싸개로 이 값을 받는다.

type Token = Record<string, unknown>;

function firebaseField(token: Token): Record<string, unknown> {
  const f = token.firebase;
  return typeof f === "object" && f !== null
    ? (f as Record<string, unknown>)
    : {};
}

export function isStaffRole(token: Token | undefined): boolean {
  return token?.role === "staff" || token?.role === "admin";
}

// 이 토큰이 2단계 인증으로 로그인한 것인지. 로컬 에뮬레이터 시드 계정(비밀번호 로그인 + devMfaBypass)만 예외.
export function hasStaffMfa(token: Token | undefined): boolean {
  if (!token) return false;
  const f = firebaseField(token);
  if (f.sign_in_second_factor === "totp") return true;
  return f.sign_in_provider === "password" && token.devMfaBypass === true;
}

// 2단계 인증 없는 운영팀 토큰은 역할만 member로 바꾼 복사본을 돌려준다 (나머지 권한 클레임은 role을 먼저 보므로 무시된다)
export function effectiveToken<T extends Token>(token: T): T {
  if (isStaffRole(token) && !hasStaffMfa(token))
    return { ...token, role: "member" };
  return token;
}
