// 시행 예정 법 개정 참고 (siteContent/lawChange, 10/31). 견적 화면 '숙박 영업 간이 확인' 아래에 접어서 보인다.
// 2026-10-27 공포·2027-10-28 시행 도농교류법 개정(농어촌민박 이관·빈집재생민박 신설). 문구는 PM이 관리 화면에서 고친다.
// AI 인허가 안내(RAG) 자료에는 넣지 않는다 — 현행 규정과 섞여 '지금 된다'로 안내될 수 있다.
// 이 파일은 React·Firebase를 import하지 않는다.

export interface LawChangeItem {
  title: string;
  body: string;
}

export interface LawChange {
  // 끄면 견적 화면에서 숨긴다
  enabled: boolean;
  title: string;
  note: string;
  items: LawChangeItem[];
}

export const LAW_LIMITS = {
  title: 80,
  note: 300,
  itemTitle: 60,
  itemBody: 400,
  items: 8,
};

export const DEFAULT_LAW_CHANGE: LawChange = {
  enabled: true,
  title: "2027년 10월 28일 시행 예정 — 농어촌민박 제도 개정 (참고)",
  note: "「도시와 농어촌 간의 교류촉진에 관한 법률」 개정안이 2026년 10월 27일 공포되었습니다. 시행 전까지는 현행 규정이 적용되고, 세부 기준(부령·조례)은 아직 정해지지 않았습니다. 법적 판정이 아닌 참고 정보입니다.",
  items: [
    {
      title: "빈집재생민박 신설",
      body: "시장·군수·구청장이 확인한 날부터 1년 이상 아무도 살거나 쓰지 않은 빈집으로 민박을 하면 '빈집재생민박'이 됩니다. 이 경우 지역 주민 요건과 그 집에 거주해야 하는 요건을 적용하지 않습니다.",
    },
    {
      title: "운영 주체와 관리자",
      body: "개인은 부령으로 정하는 주택 수 안에서 운영합니다. 법인·단체는 지방자치단체, 마을기업·사회적기업·사회적협동조합, 매출액 등이 일정 금액 이하인 중소기업, 비영리법인이어야 합니다. 안전점검·시설관리를 맡을 관리자를 반드시 두어야 하고(어기면 형사처벌), 관리자도 매년 서비스·위생·소방안전 교육을 받습니다.",
    },
    {
      title: "신고제 → 등록제, 사전 거주·주택 소유 요건 폐지",
      body: "농어촌민박은 사업장마다 시·군·구에 등록합니다. 미리 일정 기간 살아야 하는 요건과 주택 소유 요건은 없어집니다. 규모 기준은 조례로, 인구감소지역은 객실 수 기준도 조례로 달리 정할 수 있습니다.",
    },
    {
      title: "요금·예약·표시 의무",
      body: "숙박요금을 시·군·구에 신고하고 지켜야 하며, 천재지변 등이 아니면 예약자 동의 없이 예약을 취소·변경할 수 없습니다(취소 뒤 비싸게 재판매하면 과징금). 출입문·홈페이지·SNS에 농어촌민박 표시가 의무입니다. 조식은 숙박요금에 포함하고, 그 밖의 식사는 식품위생법 허가를 받아 투숙객에게만 제공합니다.",
    },
  ],
};

const str = (v: unknown, max: number) =>
  typeof v === "string" ? v.slice(0, max).trim() : "";

// 저장값 → 화면에 쓸 내용 (문서가 없으면 기본 문구, 빈 항목은 뺀다)
export function readLawChange(raw: unknown): LawChange {
  if (!raw || typeof raw !== "object") return DEFAULT_LAW_CHANGE;
  const r = raw as Record<string, unknown>;
  const items = Array.isArray(r.items)
    ? r.items
        .slice(0, LAW_LIMITS.items)
        .map((x) => {
          const i = (x ?? {}) as Record<string, unknown>;
          return {
            title: str(i.title, LAW_LIMITS.itemTitle),
            body: str(i.body, LAW_LIMITS.itemBody),
          };
        })
        .filter((i) => i.title && i.body)
    : DEFAULT_LAW_CHANGE.items;
  return {
    enabled: r.enabled !== false,
    title: str(r.title, LAW_LIMITS.title) || DEFAULT_LAW_CHANGE.title,
    note: str(r.note, LAW_LIMITS.note),
    items,
  };
}

// 저장 전 검사. 문제가 없으면 빈 배열
export function validateLawChange(c: LawChange): string[] {
  const errors: string[] = [];
  if (!c.title.trim()) errors.push("제목을 입력하세요.");
  if (c.title.length > LAW_LIMITS.title)
    errors.push(`제목은 ${LAW_LIMITS.title}자까지입니다.`);
  if (c.note.length > LAW_LIMITS.note)
    errors.push(`안내 문구는 ${LAW_LIMITS.note}자까지입니다.`);
  if (c.items.length > LAW_LIMITS.items)
    errors.push(`항목은 ${LAW_LIMITS.items}개까지입니다.`);
  c.items.forEach((i, n) => {
    const label = `${n + 1}번 항목`;
    if (!i.title.trim() || !i.body.trim())
      errors.push(`${label}: 제목과 내용을 모두 입력하세요.`);
    if (i.title.length > LAW_LIMITS.itemTitle)
      errors.push(`${label}: 제목은 ${LAW_LIMITS.itemTitle}자까지입니다.`);
    if (i.body.length > LAW_LIMITS.itemBody)
      errors.push(`${label}: 내용은 ${LAW_LIMITS.itemBody}자까지입니다.`);
  });
  if (
    /가능합니다|허가 가능|영업 가능/.test(
      [c.title, c.note, ...c.items.map((i) => `${i.title} ${i.body}`)].join(
        " ",
      ),
    )
  )
    errors.push("'가능'으로 판정하는 표현은 쓰지 않습니다(법적 판정 아님).");
  return errors;
}
