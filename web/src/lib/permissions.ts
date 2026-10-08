// 운영팀 권한 (prd.md 4절 권한표). functions/src/permissions.ts와 키 이름을 같게 유지한다.
// 로그인 토큰의 커스텀 클레임에서 읽는다. 클레임은 회원 문서가 바뀌면 syncUserClaims 함수가 갱신한다.

export type Role = "member" | "staff" | "admin";
export type AccessLevel = "all" | "assigned" | "none";

export const FLAG_KEYS = [
  "canEditPrices",
  "canEditAssumptions",
  "canApproveVersions",
  "canEditContent",
  "canReviewDiagnosis",
  "canReviewCosts",
  "canEnterBranchRecords",
] as const;
export type FlagKey = (typeof FLAG_KEYS)[number];

export interface Permissions {
  role: Role;
  photoAccess: AccessLevel;
  consultAccess: AccessLevel;
  perms: FlagKey[];
}

const ROLES: Role[] = ["member", "staff", "admin"];
const LEVELS: AccessLevel[] = ["all", "assigned", "none"];

// 클레임이 없거나 이상하면 일반 회원으로 본다. 화면 표시용이며, 실제 접근은 보안 규칙이 막는다.
export function permissionsFromClaims(
  claims: Record<string, unknown>,
): Permissions {
  const role = ROLES.includes(claims.role as Role)
    ? (claims.role as Role)
    : "member";
  const level = (v: unknown): AccessLevel =>
    LEVELS.includes(v as AccessLevel) ? (v as AccessLevel) : "none";
  const perms = Array.isArray(claims.perms)
    ? FLAG_KEYS.filter((k) => (claims.perms as unknown[]).includes(k))
    : [];
  if (role === "member")
    return { role, photoAccess: "none", consultAccess: "none", perms: [] };
  return {
    role,
    photoAccess: level(claims.photoAccess),
    consultAccess: level(claims.consultAccess),
    perms,
  };
}

export function can(p: Permissions, flag: FlagKey) {
  return p.role === "admin" || p.perms.includes(flag);
}
