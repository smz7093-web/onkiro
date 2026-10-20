// 관리자 첫 화면 '아직 할 일' (UX기준 21 목표 경사·22 자이가르닉, 10/19).
// 읽은 상태로 할 일 목록을 만든다. 이 파일은 React·Firebase를 import하지 않는다.
import {
  RECOMMENDED_CHECKLIST_RULES,
  type ChecklistRule,
} from "../engine/checklist";
import { calculateEstimate, roundForDisplay } from "../engine/estimate";
import {
  REFERENCE_ESTIMATE,
  REFERENCE_ESTIMATE_INPUT,
  REFERENCE_INVESTMENT,
  REFERENCE_REVENUE,
} from "../engine/reference";
import { calculateScenarios } from "../engine/revenue";
import type { AssumptionSet, PriceTable, ProcessId } from "../engine/types";
import { PROCESS_LABELS } from "../engine/types";

// 적용 중 버전이 10/19 확정안과 같은 결과를 내는지 (관리 화면 검증 사례와 같은 기준). 시연 대본 금액이 이 값을 전제로 한다
export function priceMatchesReference(price: PriceTable | null): boolean {
  if (!price) return false;
  // 판정표도 확정안과 같아야 한다 (10/20: 적용 중이던 10/18 초안 판정표에 '비 샘 → 큰 균열' 같은 잘못된 줄이 있었다)
  if (!sameRules(price.checklistRules ?? [], RECOMMENDED_CHECKLIST_RULES))
    return false;
  try {
    const r = calculateEstimate(REFERENCE_ESTIMATE_INPUT, price);
    return (
      roundForDisplay(r.subtotal) === REFERENCE_ESTIMATE.subtotal &&
      roundForDisplay(r.total) === REFERENCE_ESTIMATE.total &&
      r.rangeLow === REFERENCE_ESTIMATE.rangeLow &&
      r.rangeHigh === REFERENCE_ESTIMATE.rangeHigh &&
      r.days === REFERENCE_ESTIMATE.days
    );
  } catch {
    return false;
  }
}

// 줄 순서는 상관없이 같은 줄들인지
function sameRules(a: readonly ChecklistRule[], b: readonly ChecklistRule[]) {
  const key = (r: ChecklistRule) =>
    [r.question, r.answer, r.process ?? "", r.grade ?? "", r.risk ?? ""].join(
      "|",
    );
  const ka = a.map(key).sort();
  const kb = b.map(key).sort();
  return ka.length === kb.length && ka.every((k, i) => k === kb[i]);
}

export function assumptionMatchesReference(
  assumption: AssumptionSet | null | undefined,
): boolean {
  if (!assumption) return false;
  const man = (won: number) => Math.round(won / 10_000);
  try {
    const s = calculateScenarios(
      assumption.defaults,
      REFERENCE_INVESTMENT,
      assumption,
    );
    return (["conservative", "base", "optimistic"] as const).every(
      (id) =>
        man(s[id].revenue) === REFERENCE_REVENUE[id].revenue &&
        man(s[id].net) === REFERENCE_REVENUE[id].net,
    );
  } catch {
    return false;
  }
}

// 초안 하나: 이름과 만든 시각
export interface DraftInfo {
  id: string;
  createdAt: Date | null;
}

// 적용 중인 버전보다 나중에 만든 초안만 '적용 대기'. 그 전에 만든 초안은 적용되지 않고 남은 것(지워도 됨)
export function splitDrafts(drafts: DraftInfo[], activeSince: Date | null) {
  const pending: string[] = [];
  const stale: string[] = [];
  for (const d of drafts) {
    if (activeSince && d.createdAt && d.createdAt < activeSince)
      stale.push(d.id);
    else pending.push(d.id);
  }
  return { pending, stale };
}

export interface TodoState {
  activePrice: PriceTable | null;
  activeAssumption?: AssumptionSet | null;
  priceDrafts: string[];
  assumptionDrafts: string[];
  // 적용 중 버전보다 먼저 만든, 남겨진 초안 (할 일이 아니라 정리 안내)
  stalePriceDrafts?: string[];
  staleAssumptionDrafts?: string[];
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

const staleNote = (stale?: string[]) =>
  stale && stale.length > 0
    ? ` (적용 중 버전보다 먼저 만든 초안 ${stale.join(", ")}은 지워도 됩니다)`
    : "";

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
          ? `적용 대기 단가 초안 없음${staleNote(s.stalePriceDrafts)}`
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
      id: "confirmedPrice",
      done: priceMatchesReference(s.activePrice),
      text: priceMatchesReference(s.activePrice)
        ? "적용 중 단가·판정표가 확정안과 같음 (검증 사례 3,700만·25일, 시연 대본 금액과 일치)"
        : "적용 중 단가 또는 판정표가 확정안과 다름 — 단가 DB에서 '확정안 전체 불러오기' → 저장 → 적용 (시연 대본 금액·위험 신호가 달라짐)",
      href: "/admin/prices",
      d: ["D5"],
    },
    {
      id: "confirmedAssumption",
      done: assumptionMatchesReference(s.activeAssumption),
      text: assumptionMatchesReference(s.activeAssumption)
        ? "적용 중 가정값이 확정안과 같음 (가동률 35·50·65%)"
        : "적용 중 가정값이 확정안과 다름 — 가정값에서 '확정안 불러오기' → 저장 → 적용",
      href: "/admin/assumptions",
      d: ["D6"],
    },
    {
      id: "assumptionDraft",
      done: s.assumptionDrafts.length === 0,
      text:
        s.assumptionDrafts.length === 0
          ? `적용 대기 가정값 초안 없음${staleNote(s.staleAssumptionDrafts)}`
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
