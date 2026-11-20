// 진단 사진 보관 기간 (task.md 11.2, D8 확정 10/19·10/22, 개인정보 처리방침 진단 사진 항목).
// - 상담을 신청하지 않은 진단: 마지막 이용 후 1년. 마지막 이용 = 회원이 진단을 열거나(lastUsedAt) 고친 날(updatedAt) 중 늦은 날
// - 상담을 신청한 진단: 자동 삭제하지 않는다. 계약 종료 기록(11.5)이 생기면 '계약 종료 후 3년'으로 바꾼다(11/20 PM 결정)
// functions/src/retention.ts의 복사본이다. 둘을 같이 고친다.

export const PHOTO_RETENTION_YEARS = 1;

export type PhotoRetention =
  { kind: "consult" } | { kind: "expires"; at: Date; basis: Date };

export interface RetentionInput {
  lastUsedAt: Date | null;
  updatedAt: Date | null;
  createdAt: Date | null;
  hasConsult: boolean;
}

export function addYears(d: Date, years: number): Date {
  const r = new Date(d.getTime());
  r.setUTCFullYear(r.getUTCFullYear() + years);
  return r;
}

export function photoRetention(input: RetentionInput): PhotoRetention | null {
  if (input.hasConsult) return { kind: "consult" };
  const used = [input.lastUsedAt, input.updatedAt, input.createdAt].filter(
    (d): d is Date => d instanceof Date && !Number.isNaN(d.getTime()),
  );
  if (used.length === 0) return null;
  const basis = new Date(Math.max(...used.map((d) => d.getTime())));
  return {
    kind: "expires",
    basis,
    at: addYears(basis, PHOTO_RETENTION_YEARS),
  };
}

export function isExpired(r: PhotoRetention | null, now: Date): boolean {
  return r?.kind === "expires" && r.at.getTime() <= now.getTime();
}
