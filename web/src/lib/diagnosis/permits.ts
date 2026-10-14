// 숙박 영업 인허가 간이 확인 (SIM-11, task.md 7.2).
// 항목·문구는 D7(원일)이 오면 바꾼다. 지금은 임시 항목이며 모두 '확인 필요'로 시작한다.
// 원칙: "가능"이라고 표시하지 않는다. "법적 판정 아님"을 항상 보여준다.
// 10/14: 건축물대장 주용도·브이월드 도로 접면으로 주의 항목을 더한다(신호가 있을 때만).
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
}

export const PERMIT_DISCLAIMER =
  "입력하신 정보로 확인할 항목을 정리한 것이며 법적 판정이 아닙니다. 영업 가능 여부는 관할 기관에서 확정됩니다.";

// 주용도가 주택이 아니면 숙박 영업 전에 용도 변경이 필요할 수 있다
export function purposeSignal(mainPurpose: string | null): PermitItem | null {
  if (!mainPurpose || /주택/.test(mainPurpose)) return null;
  return {
    id: "mainPurpose",
    title: `건축물 용도가 '${mainPurpose}' — 주택이 아님`,
    status: "check",
    nextAction:
      "농어촌민박은 주택에서 할 수 있습니다. 용도 변경이 필요한지 관할 시·군청에 확인하세요.",
  };
}

// 도로 접면: 맹지는 건축 허가, '(불)'은 차량 통행이 어려운 길 (브이월드 도로접면 코드 이름)
export function roadSignal(roadSide: string | null): PermitItem | null {
  if (!roadSide) return null;
  if (/맹지/.test(roadSide))
    return {
      id: "roadSide",
      title: "도로에 접하지 않은 땅(맹지)",
      status: "check",
      nextAction:
        "증·개축 허가와 공사 차량 진입이 어려울 수 있습니다. 진입로 확보 방법을 현장진단에서 함께 확인하세요.",
    };
  if (/\(불\)/.test(roadSide))
    return {
      id: "roadSide",
      title: `차량 통행이 어려운 좁은 길 (${roadSide})`,
      status: "check",
      nextAction:
        "자재 운반·공사 차량 진입에 비용이 더 들 수 있습니다. 현장진단에서 진입 방법을 확인하세요.",
    };
  return null;
}

export function permitItems(
  noRegistry: boolean,
  site?: SiteSignals,
): PermitItem[] {
  const items: PermitItem[] = [
    {
      id: "ruralHomestay",
      title: "농어촌민박업 신고 요건 (주인 거주·연면적 등)",
      status: "check",
      nextAction: "관할 시·군청 담당 부서에 신고 요건을 문의하세요.",
    },
    {
      id: "hanokExperience",
      title: "한옥체험업 지정 요건 (한옥 해당 여부)",
      status: "check",
      nextAction: "한옥에 해당하는지 관할 기관에 확인하세요.",
    },
    {
      id: "zoning",
      title: "용도지역·건축물 용도에서 숙박 영업이 허용되는지",
      status: "check",
      nextAction: "토지이용계획과 건축물대장의 용도를 함께 확인하세요.",
    },
  ];
  const signals = [
    purposeSignal(site?.mainPurpose ?? null),
    roadSignal(site?.roadSide ?? null),
  ].filter((x): x is PermitItem => x !== null);
  items.unshift(...signals);
  if (noRegistry) {
    items.unshift({
      id: "noRegistry",
      title: "건축물대장 없음 — 인허가 리스크",
      status: "check",
      nextAction:
        "무허가·미등기 건물은 양성화 절차가 먼저 필요할 수 있습니다. 현장진단에서 함께 확인하세요.",
    });
  }
  return items;
}
