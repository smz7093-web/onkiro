// '사회적 가치' 페이지 (siteContent/socialValue, 11/26). (주)온기로 예비사회적기업 지정(2026-11-18) 후 미션·공익 사업 소개.
// 문구는 관리 화면 '사회적 가치'에서 콘텐츠·가정값 편집 권한자가 고친다. 켜야(enabled) 머리말 메뉴·홈 소개 칸·페이지가 보인다.
// 기본 문구는 PM 확인 전 초안이라 기본은 꺼 둔다 — 지정 유형·지정 기관·실적은 사실 확인 후 넣는다.
// 이 파일은 React·Firebase를 import하지 않는다.

export interface SocialValueItem {
  title: string;
  body: string;
}

export interface SocialValue {
  enabled: boolean;
  // 지정 사실 한 줄 (예: 2026년 11월 18일 예비사회적기업 지정, 유형·지정 기관)
  designation: string;
  mission: string;
  items: SocialValueItem[];
}

export const SOCIAL_LIMITS = {
  designation: 160,
  mission: 500,
  itemTitle: 60,
  itemBody: 500,
  items: 8,
};

export const DEFAULT_SOCIAL_VALUE: SocialValue = {
  enabled: false,
  designation:
    "(주)온기로는 2026년 11월 18일 예비사회적기업으로 지정되었습니다.",
  mission:
    "온기로는 농촌에 방치된 빈집을 고쳐 다시 사람이 머무는 집으로 되살립니다. 빈집 소유주는 관리하기 어려운 집을 지키고, 귀촌을 꿈꾸는 사람은 근거 있는 숫자로 판단하고, 마을에는 다시 사람이 찾아오도록 — 빈집 재생으로 지역에 온기를 되돌리는 것이 우리의 미션입니다.",
  items: [
    {
      title: "빈집을 다시 머무는 집으로",
      body: "충남 홍성의 빈집을 고쳐 스테이로 운영합니다. 오래 비어 무너져 가던 집이 손님을 맞는 공간이 되고, 고친 집의 실제 공사비와 운영 실적은 다음 빈집을 더 정확히 진단하는 기준으로 쌓습니다.",
    },
    {
      title: "소유주와 함께하는 위탁 운영",
      body: "온기로가 리모델링에 투자하고 계약 기간 동안 운영한 뒤, 더 좋아진 집을 소유주에게 돌려드립니다. 관리할 방법이 없던 집이 다시 쓸모 있는 자산이 됩니다.",
    },
    {
      title: "누구나 쓰는 무료 빈집 진단",
      body: "주소와 사진만 넣으면 공정별 공사비와 공사 기간, 스테이로 운영했을 때의 수익과 회수 기간을 무료로 보여드립니다. 빈집을 사거나 빌리기 전에 무리한 투자를 피하도록 돕습니다.",
    },
    {
      title: "근거를 공개하는 숫자",
      body: "모든 금액에 데이터 출처와 가정값을 함께 표시하고, 추정치라는 점을 숨기지 않습니다. 고령 소유주도 읽을 수 있는 큰 글씨와 전화 상담 경로를 둡니다.",
    },
  ],
};

const str = (v: unknown, max: number) =>
  typeof v === "string" ? v.slice(0, max).trim() : "";

// 저장값 → 화면에 쓸 내용 (문서가 없으면 기본 초안·꺼짐, 빈 항목은 뺀다)
export function readSocialValue(raw: unknown): SocialValue {
  if (!raw || typeof raw !== "object") return DEFAULT_SOCIAL_VALUE;
  const r = raw as Record<string, unknown>;
  const items = Array.isArray(r.items)
    ? r.items
        .slice(0, SOCIAL_LIMITS.items)
        .map((x) => {
          const i = (x ?? {}) as Record<string, unknown>;
          return {
            title: str(i.title, SOCIAL_LIMITS.itemTitle),
            body: str(i.body, SOCIAL_LIMITS.itemBody),
          };
        })
        .filter((i) => i.title && i.body)
    : DEFAULT_SOCIAL_VALUE.items;
  return {
    enabled: r.enabled === true,
    designation: str(r.designation, SOCIAL_LIMITS.designation),
    mission: str(r.mission, SOCIAL_LIMITS.mission),
    items,
  };
}

// 저장 전 검사. 문제가 없으면 빈 배열
export function validateSocialValue(c: SocialValue): string[] {
  const errors: string[] = [];
  if (!c.mission.trim()) errors.push("미션 문구를 입력하세요.");
  if (c.designation.length > SOCIAL_LIMITS.designation)
    errors.push(`지정 안내는 ${SOCIAL_LIMITS.designation}자까지입니다.`);
  if (c.mission.length > SOCIAL_LIMITS.mission)
    errors.push(`미션 문구는 ${SOCIAL_LIMITS.mission}자까지입니다.`);
  if (c.items.length > SOCIAL_LIMITS.items)
    errors.push(`사업 소개는 ${SOCIAL_LIMITS.items}개까지입니다.`);
  c.items.forEach((i, n) => {
    const label = `${n + 1}번 사업`;
    if (!i.title.trim() || !i.body.trim())
      errors.push(`${label}: 제목과 내용을 모두 입력하세요.`);
    if (i.title.length > SOCIAL_LIMITS.itemTitle)
      errors.push(`${label}: 제목은 ${SOCIAL_LIMITS.itemTitle}자까지입니다.`);
    if (i.body.length > SOCIAL_LIMITS.itemBody)
      errors.push(`${label}: 내용은 ${SOCIAL_LIMITS.itemBody}자까지입니다.`);
  });
  // 예비사회적기업은 '사회적기업' 인증을 받은 것이 아니다 (사회적기업 육성법: 인증받지 않은 곳의 '사회적기업' 명칭 사용 금지)
  const all = [
    c.designation,
    c.mission,
    ...c.items.map((i) => i.title + " " + i.body),
  ].join(" ");
  if (
    /(?<!예비)사회적기업\s*(인증|으로\s*인증)/.test(all) ||
    /인증\s*사회적기업/.test(all)
  )
    errors.push(
      "'사회적기업 인증'으로 읽히는 표현은 쓰지 않습니다. 지금은 '예비사회적기업 지정'입니다.",
    );
  return errors;
}
