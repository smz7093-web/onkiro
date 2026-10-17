// 숙박 영업 인허가 간이 확인 (SIM-11, task.md 7.2).
// 문구(D7, 원일)는 관리 화면 /admin/permits에서 고친다(siteContent/permits). 문서가 없으면 아래 기본 문구.
// 원칙: "가능"이라고 표시하지 않는다. "법적 판정 아님"을 항상 보여준다.
// 10/14: 건축물대장 주용도·브이월드 도로 접면으로 주의 항목을 더한다(신호가 있을 때만).
// 어떤 집일 때 조건부 항목을 보여 줄지(판정)는 코드가 정하고, 관리 화면은 문구만 고친다.
// 이 파일은 React·Firebase를 import하지 않는다.

import type { SiteSignals } from "./compute";

export type PermitStatus = "check" | "noSignal" | "confirmed";

export const PERMIT_STATUS_LABELS: Record<PermitStatus, string> = {
  check: "확인 필요",
  noSignal: "주의 신호 없음",
  confirmed: "확인됨",
};

export interface PermitItem {
  id: string;
  title: string;
  status: PermitStatus;
  // 사용자가 할 다음 행동
  nextAction: string;
  // 문의할 관할 기관 (없으면 빈 문자열)
  agency?: string;
}

export const PERMIT_DISCLAIMER =
  "입력하신 정보로 확인할 항목을 정리한 것이며 법적 판정이 아닙니다. 영업 가능 여부는 관할 기관에서 확정됩니다.";

// 관리 화면에서 고치는 문구
export interface PermitText {
  title: string;
  nextAction: string;
  agency: string;
}

// 조건부 항목. 제목의 {용도}·{도로}는 대장·토지 정보 값으로 바뀐다
export const CONDITIONAL_PERMITS = [
  {
    id: "noRegistry",
    when: "건축물대장이 없다고 고른 집",
    placeholder: null,
  },
  {
    id: "mainPurpose",
    when: "대장 주용도에 '주택'이 없는 집",
    placeholder: "{용도}",
  },
  { id: "roadBlind", when: "도로에 접하지 않은 땅(맹지)", placeholder: null },
  {
    id: "roadNarrow",
    when: "차량 통행이 어려운 길에 접한 땅(세로(불) 등)",
    placeholder: "{도로}",
  },
] as const;
export type ConditionalPermitId = (typeof CONDITIONAL_PERMITS)[number]["id"];

export interface PermitContent {
  // 모든 집에 보이는 항목 (순서대로)
  general: (PermitText & { id: string })[];
  conditional: Record<ConditionalPermitId, PermitText>;
}

export const DEFAULT_PERMIT_CONTENT: PermitContent = {
  // 10/17 권장 초안(팀원결정권장안.md, 원일 확인 전). 관리 화면에서 저장하면 그 문구가 쓰인다
  general: [
    {
      id: "ruralHomestay",
      title: "농어촌민박업 신고 요건 (주인 거주·연면적 230㎡ 미만 단독주택)",
      nextAction:
        "신고자가 그 집에 실제로 거주해야 합니다. 거주 기간 등 세부 요건을 관할 시·군청에 확인하세요.",
      agency: "",
    },
    {
      id: "operatorModel",
      title: "운영 방식에 맞는 인허가 (위탁 운영이면 한옥체험업·숙박업 검토)",
      nextAction:
        "집주인이 살지 않고 다른 사람이 운영하면 농어촌민박이 아닌 다른 인허가가 필요할 수 있습니다. 상담에서 함께 정합니다.",
      agency: "",
    },
    {
      id: "hanokExperience",
      title: "한옥체험업 지정 요건 (한옥 해당 여부)",
      nextAction: "한옥에 해당하는지 관할 기관에 확인하세요.",
      agency: "",
    },
    {
      id: "zoning",
      title: "용도지역·건축물 용도에서 숙박 영업이 허용되는지",
      nextAction: "토지이용계획과 건축물대장의 용도를 함께 확인하세요.",
      agency: "",
    },
    {
      id: "fireSafety",
      title:
        "소방·안전 설비 (소화기·단독경보형 감지기, 가스 사용 시 일산화탄소 경보기)",
      nextAction:
        "객실마다 소화기와 감지기를 갖추고, 가스를 쓰면 일산화탄소 경보기를 설치하세요. 세부 기준은 관할 소방서에 확인하세요.",
      agency: "",
    },
    {
      id: "insurance",
      title: "영업배상책임보험 가입",
      nextAction:
        "숙박 영업 전에 손님 사고에 대비한 배상책임보험 가입이 필요합니다.",
      agency: "",
    },
    {
      id: "waterSeptic",
      title: "먹는 물·오수 처리 (지하수 수질검사, 정화조 용량)",
      nextAction:
        "지하수를 쓰면 먹는 물 수질검사가, 손님이 늘면 정화조 처리 용량 확인이 필요할 수 있습니다.",
      agency: "",
    },
  ],
  conditional: {
    noRegistry: {
      title: "건축물대장 없음 — 인허가 리스크",
      nextAction:
        "무허가·미등기 건물은 양성화 절차가 먼저 필요할 수 있습니다. 현장진단에서 함께 확인하세요.",
      agency: "",
    },
    mainPurpose: {
      title: "건축물 용도가 '{용도}' — 주택이 아님",
      nextAction:
        "농어촌민박은 주택에서 할 수 있습니다. 용도 변경이 필요한지 관할 시·군청에 확인하세요.",
      agency: "",
    },
    roadBlind: {
      title: "도로에 접하지 않은 땅(맹지)",
      nextAction:
        "증·개축 허가와 공사 차량 진입이 어려울 수 있습니다. 진입로 확보 방법을 현장진단에서 함께 확인하세요.",
      agency: "",
    },
    roadNarrow: {
      title: "차량 통행이 어려운 좁은 길 ({도로})",
      nextAction:
        "자재 운반·공사 차량 진입에 비용이 더 들 수 있습니다. 현장진단에서 진입 방법을 확인하세요.",
      agency: "",
    },
  },
};

const item = (id: string, t: PermitText, title = t.title): PermitItem => ({
  id,
  title,
  status: "check",
  nextAction: t.nextAction,
  agency: t.agency,
});

// 주용도가 주택이 아니면 숙박 영업 전에 용도 변경이 필요할 수 있다
export function purposeSignal(
  mainPurpose: string | null,
  content: PermitContent = DEFAULT_PERMIT_CONTENT,
): PermitItem | null {
  if (!mainPurpose || /주택/.test(mainPurpose)) return null;
  const t = content.conditional.mainPurpose;
  return item("mainPurpose", t, t.title.replaceAll("{용도}", mainPurpose));
}

// 도로 접면: 맹지는 건축 허가, '(불)'은 차량 통행이 어려운 길 (브이월드 도로접면 코드 이름)
export function roadSignal(
  roadSide: string | null,
  content: PermitContent = DEFAULT_PERMIT_CONTENT,
): PermitItem | null {
  if (!roadSide) return null;
  if (/맹지/.test(roadSide))
    return item("roadSide", content.conditional.roadBlind);
  if (/\(불\)/.test(roadSide)) {
    const t = content.conditional.roadNarrow;
    return item("roadSide", t, t.title.replaceAll("{도로}", roadSide));
  }
  return null;
}

export function permitItems(
  noRegistry: boolean,
  site?: SiteSignals,
  content: PermitContent = DEFAULT_PERMIT_CONTENT,
): PermitItem[] {
  const items = content.general.map((g) => item(g.id, g));
  const signals = [
    purposeSignal(site?.mainPurpose ?? null, content),
    roadSignal(site?.roadSide ?? null, content),
  ].filter((x): x is PermitItem => x !== null);
  items.unshift(...signals);
  if (noRegistry)
    items.unshift(item("noRegistry", content.conditional.noRegistry));
  return items;
}
