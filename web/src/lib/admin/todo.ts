// 관리자 첫 화면 '아직 할 일' (UX기준 21 목표 경사·22 자이가르닉, 10/19).
// 읽은 상태로 할 일 목록을 만든다. 이 파일은 React·Firebase를 import하지 않는다.
import type { PriceTable, ProcessId } from "../engine/types";
import { PROCESS_LABELS } from "../engine/types";

export interface TodoState {
  activePrice: PriceTable | null;
  priceDrafts: string[];
  assumptionDrafts: string[];
  permitsSaved: boolean;
  photoGuidesSaved: boolean;
  branchCount: number;
  // 볼 권한이 없으면 null
  receivedConsults: number | null;
}

export interface TodoItem {
  id: string;
  done: boolean;
  text: string;
  href: string;
  d: string[];
}

// 견적에 꼭 필요한데 단가가 비면 견적이 낮게 나오는 공정
const NEEDED: ProcessId[] = ["insulation", "electrical"];

const NEEDED_RULE_PROCESSES: ProcessId[] = [
  "roof",
  "structure",
  "electrical",
  "insulation",
];

const draftHref = (base: string, drafts: string[]) =>
  drafts.length === 1 ? `${base}/${drafts[0]}` : base;

export function buildTodo(s: TodoState): TodoItem[] {
  const missing = NEEDED.filter((id) => !s.activePrice?.processes[id]);
  const rules = s.activePrice?.checklistRules ?? [];
  // 기본 판정표(욕실·주방·위험 신호)에는 없는, 지붕·구조·설비·단열 판정이 들어 있으면 D4가 반영된 것
  const rulesFilled = rules.some(
    (r) => r.process !== null && NEEDED_RULE_PROCESSES.includes(r.process),
  );
  const items: TodoItem[] = [];
  if (s.receivedConsults !== null)
    items.push({
      id: "consults",
      done: s.receivedConsults === 0,
      text:
        s.receivedConsults === 0
          ? "새 상담 접수 없음"
          : `새 상담 ${s.receivedConsults}건 — 영업일 1일 안에 첫 연락`,
      href: "/admin/consults",
      d: ["D13"],
    });
  items.push(
    {
      id: "priceDraft",
      done: s.priceDrafts.length === 0,
      text:
        s.priceDrafts.length === 0
          ? "적용 대기 단가 초안 없음"
          : `단가 초안 ${s.priceDrafts.join(", ")} — 검증 사례 확인 후 적용`,
      href: draftHref("/admin/prices", s.priceDrafts),
      d: ["D4", "D5"],
    },
    {
      id: "priceProcesses",
      done: missing.length === 0,
      text:
        missing.length === 0
          ? "적용 중 단가에 단열·창호, 전기·설비 단가 있음"
          : `적용 중 단가에 ${missing.map((id) => PROCESS_LABELS[id]).join(", ")} 단가 없음 (견적이 낮게 나옴)`,
      href: "/admin/prices",
      d: ["D5"],
    },
    {
      id: "rules",
      done: rulesFilled,
      text: rulesFilled
        ? `적용 중 판정표 ${rules.length}줄`
        : "적용 중 판정표가 기본(욕실·주방)뿐 — 지붕·구조·설비 보수가 견적에서 빠짐",
      href: "/admin/prices",
      d: ["D4"],
    },
    {
      id: "assumptionDraft",
      done: s.assumptionDrafts.length === 0,
      text:
        s.assumptionDrafts.length === 0
          ? "적용 대기 가정값 초안 없음"
          : `가정값 초안 ${s.assumptionDrafts.join(", ")} — 확인 후 적용`,
      href: draftHref("/admin/assumptions", s.assumptionDrafts),
      d: ["D6"],
    },
    {
      id: "permits",
      done: s.permitsSaved,
      text: s.permitsSaved
        ? "인허가 문구 저장됨"
        : "인허가 문구가 기본(권장안) 그대로 — 원일 확인 후 저장",
      href: "/admin/permits",
      d: ["D7"],
    },
    {
      id: "photoGuides",
      done: s.photoGuidesSaved,
      text: s.photoGuidesSaved
        ? "촬영 가이드 저장됨"
        : "촬영 가이드가 기본(권장안) 그대로 — 해순 확인 후 저장",
      href: "/admin/photo-guides",
      d: ["D9"],
    },
    {
      id: "branches",
      done: s.branchCount >= 2,
      text:
        s.branchCount >= 2
          ? `숙소 ${s.branchCount}곳 등록`
          : `숙소 ${s.branchCount}곳 등록 — 2호점 콘텐츠 입력 필요`,
      href: "/admin/branches",
      d: ["D12"],
    },
  );
  return items;
}
