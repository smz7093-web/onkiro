// 상담 관리 (CON-02, task.md 9.2). 상태·담당자·메모 변경과 전화 접수 대리 입력을 서버에서 검증한다.
// 상수는 web/src/lib/consult/status.ts와 같게 유지한다. 단계 이동 규칙(D13, 원일)은 화면이 canTransition으로 거른다.

export const CONSULT_TYPES = ["inspection", "turnkey", "entrust"] as const;
export type ConsultType = (typeof CONSULT_TYPES)[number];

export const CONSULT_STAGES = [
  "received",
  "contacted",
  "visitScheduled",
  "proposed",
  "contracted",
  "onHold",
] as const;
export type ConsultStage = (typeof CONSULT_STAGES)[number];

export const OWNERSHIPS = ["self", "family", "coHeir", "other"] as const;

export type EventKind = "status" | "assignee" | "memo";

export interface ConsultEvent {
  kind: EventKind;
  before: string | null;
  after: string | null;
}

// 토큰 클레임으로 이 상담을 다룰 수 있는지 (firestore.rules canHandleConsult와 같은 규칙)
export function canHandle(
  token: Record<string, unknown> | undefined,
  uid: string,
  assigneeUid: string | null,
): boolean {
  if (!token) return false;
  if (token.role === "admin") return true;
  if (token.role !== "staff") return false;
  const level = token.consultAccess;
  return level === "all" || (level === "assigned" && assigneeUid === uid);
}

// 다른 사람에게 배정하거나 전화 접수를 대신 넣는 일은 전체 상담 권한(접수 담당)만 한다
export function canManageAll(
  token: Record<string, unknown> | undefined,
): boolean {
  return (
    token?.role === "admin" ||
    (token?.role === "staff" && token.consultAccess === "all")
  );
}

export interface UpdateInput {
  status?: ConsultStage;
  assigneeUid?: string | null;
  memo?: string;
}

// 요청 → 검증된 변경. 실제로 바뀌는 항목만 이벤트로 남긴다.
export function planUpdate(
  current: { status: string; assigneeUid: string | null; memo: string },
  raw: unknown,
):
  | { ok: true; changes: UpdateInput; events: ConsultEvent[] }
  | { ok: false; error: string } {
  if (typeof raw !== "object" || raw === null)
    return { ok: false, error: "입력이 없습니다" };
  const i = raw as Record<string, unknown>;
  const changes: UpdateInput = {};
  const events: ConsultEvent[] = [];

  if (i.status !== undefined) {
    if (!CONSULT_STAGES.includes(i.status as ConsultStage))
      return { ok: false, error: "알 수 없는 상담 단계입니다" };
    if (i.status !== current.status) {
      changes.status = i.status as ConsultStage;
      events.push({
        kind: "status",
        before: current.status,
        after: i.status as string,
      });
    }
  }
  if (i.assigneeUid !== undefined) {
    if (
      i.assigneeUid !== null &&
      (typeof i.assigneeUid !== "string" || i.assigneeUid === "")
    )
      return { ok: false, error: "담당자가 올바르지 않습니다" };
    if (i.assigneeUid !== current.assigneeUid) {
      changes.assigneeUid = i.assigneeUid as string | null;
      events.push({
        kind: "assignee",
        before: current.assigneeUid,
        after: i.assigneeUid as string | null,
      });
    }
  }
  if (i.memo !== undefined) {
    if (typeof i.memo !== "string" || i.memo.length > 2000)
      return { ok: false, error: "메모는 2,000자 이하의 글이어야 합니다" };
    if (i.memo !== current.memo) {
      changes.memo = i.memo;
      events.push({ kind: "memo", before: current.memo, after: i.memo });
    }
  }
  return { ok: true, changes, events };
}

export interface ProxyInput {
  type: ConsultType;
  applicantName: string;
  phone: string;
  ownership: (typeof OWNERSHIPS)[number];
  preferredDate: string | null;
  memo: string;
}

// 전화 접수 대리 입력 검증 (회원 계정 없이 운영팀이 넣는 상담)
export function parseProxyInput(
  raw: unknown,
): { ok: true; value: ProxyInput } | { ok: false; error: string } {
  if (typeof raw !== "object" || raw === null)
    return { ok: false, error: "입력이 없습니다" };
  const i = raw as Record<string, unknown>;
  if (!CONSULT_TYPES.includes(i.type as ConsultType))
    return { ok: false, error: "상담 유형이 올바르지 않습니다" };
  if (typeof i.applicantName !== "string" || i.applicantName.trim() === "")
    return { ok: false, error: "신청인 이름이 필요합니다" };
  if (typeof i.phone !== "string" || !/^[0-9-+ ]{8,20}$/.test(i.phone.trim()))
    return { ok: false, error: "연락처 형식이 올바르지 않습니다" };
  if (!OWNERSHIPS.includes(i.ownership as ProxyInput["ownership"]))
    return { ok: false, error: "소유 관계가 올바르지 않습니다" };
  if (
    i.preferredDate !== null &&
    i.preferredDate !== undefined &&
    (typeof i.preferredDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(i.preferredDate))
  )
    return { ok: false, error: "희망 연락일 형식이 올바르지 않습니다" };
  if (
    i.memo !== undefined &&
    (typeof i.memo !== "string" || i.memo.length > 2000)
  )
    return { ok: false, error: "메모는 2,000자 이하여야 합니다" };
  return {
    ok: true,
    value: {
      type: i.type as ConsultType,
      applicantName: i.applicantName.trim(),
      phone: i.phone.trim(),
      ownership: i.ownership as ProxyInput["ownership"],
      preferredDate: (i.preferredDate as string | null | undefined) ?? null,
      memo: (i.memo as string | undefined) ?? "",
    },
  };
}
