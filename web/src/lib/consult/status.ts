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

// from 단계에서 to 단계로 옮길 수 있는지.
// TODO(원일, D13): 허용하는 이동을 정한다. 정해진 것: 어느 단계에서든 보류로 갈 수 있다(prd.md 5절).
// 정할 것: 단계를 건너뛸 수 있는지(예: 접수 → 제안), 되돌릴 수 있는지, 보류에서 어디로 돌아가는지,
// 계약 후에 바꿀 수 있는지.
export function canTransition(from: ConsultStage, to: ConsultStage): boolean {
  if (from === to) return false;
  if (to === "onHold") return true;
  // 임시 규칙: D13 전까지는 나머지 이동을 모두 허용한다
  return true;
}

// 담당자 후보. 화면이 운영팀 목록에서 만든다.
export interface StaffCandidate {
  uid: string;
  name: string;
  // 이 사람이 맡는 상담 유형
  handles: ConsultType[];
}

// 새 상담에 배정할 담당자 추천. 추천만 하고, 실제 배정은 담당자가 화면에서 확정한다.
// TODO(원일, D13): 유형별 기본 담당(예: 현장진단 → 석원, 턴키 PM·빈집 맡기기 → 원일),
// 담당이 여러 명이면 누구를 고를지. 맞는 사람이 없으면 null(접수 담당이 직접 배정).
export function suggestAssignee(
  type: ConsultType,
  candidates: StaffCandidate[],
): string | null {
  return candidates.find((c) => c.handles.includes(type))?.uid ?? null;
}
