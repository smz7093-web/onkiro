// 운영팀 권한 모델 (prd.md 4절 권한표, task.md 2.3).
// 원본은 Firestore users/{uid}의 필드이고, 이 모듈이 계산한 값을 Auth 커스텀 클레임에 옮긴다.
// web/src/lib/permissions.ts와 키 이름을 같게 유지한다.

export const ROLES = ["member", "staff", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const ACCESS_LEVELS = ["all", "assigned", "none"] as const;
export type AccessLevel = (typeof ACCESS_LEVELS)[number];

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
  flags: Record<FlagKey, boolean>;
}

// 토큰에 담는 형태. 켜진 플래그만 배열로 넣어 크기를 줄인다 (커스텀 클레임 1000바이트 제한).
export interface PermissionClaims {
  role: Role;
  photoAccess: AccessLevel;
  consultAccess: AccessLevel;
  perms: FlagKey[];
}

const allFlags = (value: boolean) =>
  Object.fromEntries(FLAG_KEYS.map((k) => [k, value])) as Record<FlagKey, boolean>;

const isRole = (v: unknown): v is Role => ROLES.includes(v as Role);
const isAccess = (v: unknown): v is AccessLevel => ACCESS_LEVELS.includes(v as AccessLevel);

// 회원 문서 필드 → 권한. 잘못된 값은 가장 좁은 권한으로 본다.
// admin은 필드와 관계없이 모든 권한, member는 필드와 관계없이 권한 없음.
export function permissionsFromDoc(data: Record<string, unknown> | undefined): Permissions {
  const role: Role = isRole(data?.role) ? data.role : "member";
  if (role === "admin") {
    return { role, photoAccess: "all", consultAccess: "all", flags: allFlags(true) };
  }
  if (role === "member") {
    return { role, photoAccess: "none", consultAccess: "none", flags: allFlags(false) };
  }
  const flags = allFlags(false);
  for (const k of FLAG_KEYS) flags[k] = data?.[k] === true;
  return {
    role,
    photoAccess: isAccess(data?.photoAccess) ? data.photoAccess : "none",
    consultAccess: isAccess(data?.consultAccess) ? data.consultAccess : "none",
    flags,
  };
}

export function claimsFromPermissions(p: Permissions): PermissionClaims {
  return {
    role: p.role,
    photoAccess: p.photoAccess,
    consultAccess: p.consultAccess,
    perms: FLAG_KEYS.filter((k) => p.flags[k]),
  };
}

// 현재 토큰의 클레임과 같은지 (같으면 다시 쓰지 않는다)
export function sameClaims(
  current: Record<string, unknown> | undefined,
  next: PermissionClaims,
): boolean {
  if (!current) return false;
  const perms = Array.isArray(current.perms) ? [...current.perms].sort() : [];
  return (
    current.role === next.role &&
    current.photoAccess === next.photoAccess &&
    current.consultAccess === next.consultAccess &&
    JSON.stringify(perms) === JSON.stringify([...next.perms].sort())
  );
}

// 관리자 함수 입력 검증 → 회원 문서에 쓸 필드. 잘못된 입력은 오류 문구를 돌려준다.
export function permissionFieldsFromInput(
  input: unknown,
): { ok: true; fields: Record<string, unknown> } | { ok: false; error: string } {
  if (typeof input !== "object" || input === null) return { ok: false, error: "입력이 없습니다" };
  const i = input as Record<string, unknown>;
  if (!isRole(i.role)) return { ok: false, error: "role은 member, staff, admin 중 하나여야 합니다" };
  if (i.photoAccess !== undefined && !isAccess(i.photoAccess))
    return { ok: false, error: "photoAccess는 all, assigned, none 중 하나여야 합니다" };
  if (i.consultAccess !== undefined && !isAccess(i.consultAccess))
    return { ok: false, error: "consultAccess는 all, assigned, none 중 하나여야 합니다" };
  const fields: Record<string, unknown> = {
    role: i.role,
    photoAccess: i.photoAccess ?? "none",
    consultAccess: i.consultAccess ?? "none",
  };
  for (const k of FLAG_KEYS) {
    if (i[k] !== undefined && typeof i[k] !== "boolean")
      return { ok: false, error: `${k}는 true/false여야 합니다` };
    fields[k] = i[k] === true;
  }
  return { ok: true, fields };
}
