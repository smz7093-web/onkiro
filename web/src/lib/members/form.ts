// 회원·권한 관리 화면(ADM-05)의 편집 값. 저장은 관리자 함수 setUserPermissions가 검증한다.
// 키 이름은 lib/permissions.ts, functions/src/permissions.ts와 같다.

import {
  FLAG_KEYS,
  type AccessLevel,
  type FlagKey,
  type Role,
} from "../permissions";

export interface PermissionForm {
  role: Role;
  photoAccess: AccessLevel;
  consultAccess: AccessLevel;
  flags: Record<FlagKey, boolean>;
}

export const ROLE_LABEL: Record<Role, string> = {
  member: "일반 회원",
  staff: "운영팀",
  admin: "관리자",
};

export const ACCESS_LABEL: Record<AccessLevel, string> = {
  all: "전체",
  assigned: "담당 건",
  none: "없음",
};

export const FLAG_LABEL: Record<FlagKey, string> = {
  canEditPrices: "단가 DB 수정",
  canEditAssumptions: "가정값 수정",
  canApproveVersions: "단가·가정값 적용",
  canEditContent: "숙소·홈 콘텐츠 수정",
  canReviewDiagnosis: "진단 보정",
  canReviewCosts: "공사비 검수",
  canEnterBranchRecords: "지점 실적 입력",
};

const ROLES: Role[] = ["member", "staff", "admin"];
const LEVELS: AccessLevel[] = ["all", "assigned", "none"];

const flagsOf = (on: FlagKey[]) =>
  Object.fromEntries(FLAG_KEYS.map((k) => [k, on.includes(k)])) as Record<
    FlagKey,
    boolean
  >;

// 회원 문서 필드 → 편집 값. 잘못된 값은 가장 좁은 권한으로 본다.
export function formFromDoc(
  data: Record<string, unknown> | undefined,
): PermissionForm {
  const role = ROLES.includes(data?.role as Role)
    ? (data!.role as Role)
    : "member";
  const level = (v: unknown): AccessLevel =>
    LEVELS.includes(v as AccessLevel) ? (v as AccessLevel) : "none";
  return {
    role,
    photoAccess: level(data?.photoAccess),
    consultAccess: level(data?.consultAccess),
    flags: flagsOf(FLAG_KEYS.filter((k) => data?.[k] === true)),
  };
}

// 화면에 보이는 실제 권한. admin은 전체, member는 없음 (functions permissionsFromDoc와 같은 규칙).
export function effectiveForm(form: PermissionForm): PermissionForm {
  if (form.role === "admin")
    return {
      role: "admin",
      photoAccess: "all",
      consultAccess: "all",
      flags: flagsOf([...FLAG_KEYS]),
    };
  if (form.role === "member")
    return {
      role: "member",
      photoAccess: "none",
      consultAccess: "none",
      flags: flagsOf([]),
    };
  return form;
}

// setUserPermissions 입력. member로 내리면 운영팀 권한 필드도 모두 지운다.
export function toCallableInput(uid: string, form: PermissionForm) {
  const f = form.role === "member" ? effectiveForm(form) : form;
  return {
    uid,
    role: f.role,
    photoAccess: f.photoAccess,
    consultAccess: f.consultAccess,
    ...f.flags,
  };
}

export function sameForm(a: PermissionForm, b: PermissionForm) {
  return (
    a.role === b.role &&
    a.photoAccess === b.photoAccess &&
    a.consultAccess === b.consultAccess &&
    FLAG_KEYS.every((k) => a.flags[k] === b.flags[k])
  );
}

// 초기 운영팀 계정 권한 (task.md 2.5, prd.md 4절, 2026-10-10 업무분장 반영)
export const PRESETS: { id: string; label: string; form: PermissionForm }[] = [
  {
    id: "haesoon",
    label: "해순 (공간기획)",
    form: {
      role: "staff",
      photoAccess: "none",
      consultAccess: "none",
      flags: flagsOf(["canEditContent"]),
    },
  },
  {
    id: "seokwon",
    label: "석원 (건축)",
    form: {
      role: "staff",
      photoAccess: "all",
      consultAccess: "assigned",
      flags: flagsOf(["canEditPrices", "canReviewDiagnosis", "canReviewCosts"]),
    },
  },
  {
    id: "wonil",
    label: "원일 (부동산개발)",
    form: {
      role: "staff",
      photoAccess: "assigned",
      consultAccess: "all",
      flags: flagsOf(["canEditAssumptions", "canEnterBranchRecords"]),
    },
  },
  {
    id: "jooyeon",
    label: "주연 (화면 UI)",
    form: {
      role: "staff",
      photoAccess: "none",
      consultAccess: "none",
      flags: flagsOf(["canEditContent"]),
    },
  },
];
