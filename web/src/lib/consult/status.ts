// 상담 상태 전이·담당 배정 규칙 (CON-02, task.md 9.7).
// 담당: 원일(D13 상담 처리 기준을 코드로). 뼈대·타입: PM.
// 이 파일은 React·Firebase를 import하지 않는다. 칸반 화면(9.2)과 서버 함수가 같은 규칙을 쓴다.

// 상담 유형 (CON-01)
export const CONSULT_TYPES = ["inspection", "turnkey", "entrust"] as const;
export type ConsultType = (typeof CONSULT_TYPES)[number];

export const CONSULT_TYPE_LABELS: Record<ConsultType, string> = {
  inspection: "현장진단",
  turnkey: "턴키 PM",
  entrust: "빈집 맡기기",
};

// 칸반 6단계 (CON-02). 화면 왼쪽부터 이 순서로 그린다.
export const CONSULT_STAGES = [
  "received",
  "contacted",
  "visitScheduled",
  "proposed",
  "contracted",
  "onHold",
] as const;
export type ConsultStage = (typeof CONSULT_STAGES)[number];

export const CONSULT_STAGE_LABELS: Record<ConsultStage, string> = {
  received: "접수",
  contacted: "연락",
  visitScheduled: "방문 예정",
  proposed: "제안",
  contracted: "계약",
  onHold: "보류",
};

// 단계 이동 규칙 (D13, 10/19 원일 확정, 팀원결정권장안.md)
// - 앞으로: 접수 → 연락 → (방문 예정) → 제안 → 계약. 방문 예정은 건너뛸 수 있다(연락 → 제안)
// - 되돌리기: 한 단계만(제안은 방문 예정 또는 연락으로), 운영팀 메모에 이유를 남긴다(isBackward)
// - 보류: 어느 단계에서나 갈 수 있고, 보류에서는 보류 직전 단계로만 돌아간다
// - 계약 후: 다른 단계로 옮기지 않는다(해지는 메모를 남기고 보류)
const FORWARD: Partial<Record<ConsultStage, ConsultStage[]>> = {
  received: ["contacted"],
  contacted: ["visitScheduled", "proposed"],
  visitScheduled: ["proposed"],
  proposed: ["contracted"],
};
const BACKWARD: Partial<Record<ConsultStage, ConsultStage[]>> = {
  contacted: ["received"],
  visitScheduled: ["contacted"],
  proposed: ["visitScheduled", "contacted"],
};

export function canTransition(
  from: ConsultStage,
  to: ConsultStage,
  // 보류에서 돌아갈 때: 보류 직전 단계 (변경 이력에서 찾는다). 모르면 연락으로 돌아갈 수 있다
  heldFrom?: ConsultStage | null,
): boolean {
  if (from === to) return false;
  if (to === "onHold") return true;
  if (from === "onHold") return to === (heldFrom ?? "contacted");
  if (from === "contracted") return false;
  return (
    (FORWARD[from]?.includes(to) ?? false) ||
    (BACKWARD[from]?.includes(to) ?? false)
  );
}

// 되돌리는 이동이면 true (화면이 운영팀 메모에 이유를 받는다)
export function isBackward(from: ConsultStage, to: ConsultStage): boolean {
  return BACKWARD[from]?.includes(to) ?? false;
}

// 담당자 후보. 화면이 운영팀 목록에서 만든다.
export interface StaffCandidate {
  uid: string;
  name: string;
  // 이 사람이 맡는 상담 유형
  handles: ConsultType[];
}

// 유형별 기본 담당 (D13, 10/19 원일 확정): 현장진단 → 석원, 턴키 PM → PM, 빈집 맡기기 → 원일.
// 이름(카카오 닉네임)에 이 글자가 들어 있는 사람을 먼저 추천한다
export const DEFAULT_ASSIGNEE_NAMES: Record<ConsultType, string[]> = {
  inspection: ["석원"],
  turnkey: ["PM", "장상민"],
  entrust: ["원일"],
};

// 새 상담에 배정할 담당자 추천. 추천만 하고, 실제 배정은 화면에서 확정한다.
// 기본 담당 이름이 맞는 사람 → 이 유형을 맡는 사람 순서. 맞는 사람이 없으면 null(직접 배정)
export function suggestAssignee(
  type: ConsultType,
  candidates: StaffCandidate[],
): string | null {
  const byName = candidates.find((c) =>
    DEFAULT_ASSIGNEE_NAMES[type].some((n) => c.name.includes(n)),
  );
  return (
    byName?.uid ?? candidates.find((c) => c.handles.includes(type))?.uid ?? null
  );
}
