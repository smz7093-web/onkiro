// '사회적 가치' 페이지 (siteContent/socialValue, 11/26). (주)온기로 예비사회적기업(지역사회공헌형) 지정(2026-11-18) 후
// 미션 선언문(미션·비전·BOT·N 전략·2035 성과목표)·공익 사업·활동 기록을 소개한다.
// 기본 문구는 PM이 준 미션 선언문(온기로미션-휴대폰용.html)·수업 사진·협약식 사진으로 만들었다. 사진은 web/public/social/.
// 문구는 관리 화면 '사회적 가치'에서 콘텐츠·가정값 편집 권한자가 고친다. 켜야(enabled) 머리말 메뉴·홈 소개 칸·페이지가 보인다.
// 이 파일은 React·Firebase를 import하지 않는다.

export interface SocialValueItem {
  title: string;
  body: string;
}

// BOT·N 전략 단계 (tag: BUILD 등 영문 꼬리표)
export interface StrategyStep {
  tag: string;
  title: string;
  body: string;
}

// 성과 목표 숫자 (value: '50채', label: '빈집 재생')
export interface ImpactGoal {
  value: string;
  label: string;
}

export interface ActivityPhoto {
  // /social/파일.jpg 또는 https 주소
  url: string;
  caption: string;
}

// 활동 기록 (교육·협약 등)
export interface Activity {
  title: string;
  date: string;
  body: string;
  photos: ActivityPhoto[];
}

export interface SocialValue {
  enabled: boolean;
  // 지정 사실 한 줄 (지정일·유형)
  designation: string;
  mission: string;
  vision: string;
  strategyTitle: string;
  strategy: StrategyStep[];
  goalsTitle: string;
  goals: ImpactGoal[];
  items: SocialValueItem[];
  activities: Activity[];
}

export const SOCIAL_LIMITS = {
  designation: 160,
  mission: 500,
  vision: 200,
  sectionTitle: 80,
  tag: 20,
  itemTitle: 60,
  itemBody: 500,
  goalValue: 20,
  goalLabel: 30,
  photoUrl: 300,
  caption: 100,
  date: 40,
  strategy: 6,
  goals: 6,
  items: 8,
  activities: 8,
  photos: 4,
};

export const DEFAULT_SOCIAL_VALUE: SocialValue = {
  enabled: false,
  designation:
    "(주)온기로는 2026년 11월 18일 예비사회적기업(지역사회공헌형)으로 지정되었습니다.",
  mission:
    "방치된 빈집을 재생하여 주민의 자립과 지역경제의 선순환을 실현합니다.",
  vision: "지속가능한 자립형 로컬재생 플랫폼, 온기로",
  strategyTitle: "BOT·N 전략 — 발굴 · 운영 · 이양 · 확장의 4단계 선순환",
  strategy: [
    {
      tag: "BUILD",
      title: "발굴하고 선투자한다",
      body: "방치된 빈집을 직접 찾아내고 재생 가능성에 먼저 투자합니다.",
    },
    {
      tag: "OPERATE",
      title: "직접 운영하고 검증한다",
      body: "현장에서 운영하며 수익 모델과 사회적 가치를 함께 검증합니다.",
    },
    {
      tag: "TRANSFER",
      title: "가르치고 이양한다",
      body: "검증된 운영 노하우를 주민에게 가르치고 운영권을 이양합니다.",
    },
    {
      tag: "NETWORK",
      title: "회수하고 확장한다",
      body: "투자금을 회수해 다음 빈집으로 재투자하는 네트워크를 만듭니다.",
    },
  ],
  goalsTitle: "2035 사회적 성과목표 — 10년 안에 만들어낼 변화",
  goals: [
    { value: "50채", label: "빈집 재생" },
    { value: "120개", label: "일자리 창출" },
    { value: "30건", label: "주민 이양" },
  ],
  items: [
    {
      title: "빈집을 다시 머무는 집으로",
      body: "충남 홍성의 빈집을 고쳐 스테이로 운영합니다. 오래 비어 무너져 가던 집이 손님을 맞는 공간이 되고, 고친 집의 실제 공사비와 운영 실적은 다음 빈집을 더 정확히 진단하는 기준으로 쌓습니다.",
    },
    {
      title: "주민·귀촌인과 함께 배우는 빈집 재생",
      body: "마을 주민과 귀촌을 준비하는 분들에게 빈집의 법적 정의, 빈집을 찾는 방법, 재생과 운영 사례를 가르칩니다. 지역 안에서 빈집을 살리는 사람이 늘어나도록 노하우를 나눕니다.",
    },
    {
      title: "소유주와 함께하는 위탁 운영",
      body: "온기로가 리모델링에 투자하고 계약 기간 동안 운영한 뒤, 더 좋아진 집을 소유주에게 돌려드립니다. 관리할 방법이 없던 집이 다시 쓸모 있는 자산이 됩니다.",
    },
    {
      title: "누구나 쓰는 무료 빈집 진단",
      body: "주소와 사진만 넣으면 공정별 공사비와 공사 기간, 스테이로 운영했을 때의 수익과 회수 기간을 데이터 출처·가정값과 함께 무료로 보여드립니다. 빈집을 사거나 빌리기 전에 무리한 투자를 피하도록 돕습니다.",
    },
  ],
  activities: [
    {
      title: "마을 주민·귀촌 희망자 빈집 재생 교육",
      date: "2026. 8. 28. · 9. 11.",
      body: "마을 주민과 귀촌을 준비하는 분들을 대상으로 빈집의 법적 정의와 개념, 빈집 발굴 채널 비교, 빈집 위기를 지역의 기회로 바꾸는 재생 사례를 함께 공부했습니다.",
      photos: [
        { url: "/social/education-1.jpg", caption: "빈집 재생 교육 현장" },
        { url: "/social/education-2.jpg", caption: "빈집의 법적 정의 강의" },
        { url: "/social/education-3.jpg", caption: "주민·귀촌 희망자 수강" },
      ],
    },
    {
      title: "홍성군 여성친화 일촌기업 협약",
      date: "2026. 11. 24.",
      body: "홍성군과 2026 여성친화 일촌기업 협약을 맺었습니다.",
      photos: [
        {
          url: "/social/hongseong-agreement.jpg",
          caption: "2026 홍성군 여성친화 일촌기업 협약식 (홍성군청)",
        },
      ],
    },
  ],
};

const str = (v: unknown, max: number) =>
  typeof v === "string" ? v.slice(0, max).trim() : "";
const objs = (v: unknown, max: number): Record<string, unknown>[] =>
  Array.isArray(v)
    ? v
        .slice(0, max)
        .map(
          (x) =>
            (x && typeof x === "object" ? x : {}) as Record<string, unknown>,
        )
    : [];

// 사진 주소는 사이트 안 경로(/social/…)나 https만
export const isPhotoUrl = (u: string) =>
  /^\/[A-Za-z0-9/_.-]+$/.test(u) || /^https:\/\/[^\s"'<>]+$/.test(u);

const L = SOCIAL_LIMITS;

// 저장값 → 화면에 쓸 내용 (문서가 없으면 기본 문구·꺼짐, 칸이 없으면 기본값, 빈 줄은 뺀다)
export function readSocialValue(raw: unknown): SocialValue {
  if (!raw || typeof raw !== "object") return DEFAULT_SOCIAL_VALUE;
  const r = raw as Record<string, unknown>;
  const D = DEFAULT_SOCIAL_VALUE;
  const has = (k: string) => Array.isArray(r[k]);
  return {
    enabled: r.enabled === true,
    designation: str(r.designation, L.designation),
    mission: str(r.mission, L.mission),
    vision: typeof r.vision === "string" ? str(r.vision, L.vision) : D.vision,
    strategyTitle:
      typeof r.strategyTitle === "string"
        ? str(r.strategyTitle, L.sectionTitle)
        : D.strategyTitle,
    strategy: has("strategy")
      ? objs(r.strategy, L.strategy)
          .map((s) => ({
            tag: str(s.tag, L.tag),
            title: str(s.title, L.itemTitle),
            body: str(s.body, L.itemBody),
          }))
          .filter((s) => s.title)
      : D.strategy,
    goalsTitle:
      typeof r.goalsTitle === "string"
        ? str(r.goalsTitle, L.sectionTitle)
        : D.goalsTitle,
    goals: has("goals")
      ? objs(r.goals, L.goals)
          .map((g) => ({
            value: str(g.value, L.goalValue),
            label: str(g.label, L.goalLabel),
          }))
          .filter((g) => g.value && g.label)
      : D.goals,
    items: has("items")
      ? objs(r.items, L.items)
          .map((i) => ({
            title: str(i.title, L.itemTitle),
            body: str(i.body, L.itemBody),
          }))
          .filter((i) => i.title && i.body)
      : D.items,
    activities: has("activities")
      ? objs(r.activities, L.activities)
          .map((a) => ({
            title: str(a.title, L.itemTitle),
            date: str(a.date, L.date),
            body: str(a.body, L.itemBody),
            photos: objs(a.photos, L.photos)
              .map((p) => ({
                url: str(p.url, L.photoUrl),
                caption: str(p.caption, L.caption),
              }))
              .filter((p) => isPhotoUrl(p.url)),
          }))
          .filter((a) => a.title)
      : D.activities,
  };
}

// 저장 전 검사. 문제가 없으면 빈 배열
export function validateSocialValue(c: SocialValue): string[] {
  const errors: string[] = [];
  const over = (v: string, max: number, label: string) => {
    if (v.length > max) errors.push(`${label}은(는) ${max}자까지입니다.`);
  };
  if (!c.mission.trim()) errors.push("미션 문구를 입력하세요.");
  over(c.designation, L.designation, "지정 안내");
  over(c.mission, L.mission, "미션");
  over(c.vision, L.vision, "비전");
  over(c.strategyTitle, L.sectionTitle, "전략 제목");
  over(c.goalsTitle, L.sectionTitle, "성과목표 제목");
  if (c.strategy.length > L.strategy)
    errors.push(`전략 단계는 ${L.strategy}개까지입니다.`);
  c.strategy.forEach((s, n) => {
    if (!s.title.trim()) errors.push(`전략 ${n + 1}단계: 제목을 입력하세요.`);
    over(s.tag, L.tag, `전략 ${n + 1}단계 꼬리표`);
    over(s.title, L.itemTitle, `전략 ${n + 1}단계 제목`);
    over(s.body, L.itemBody, `전략 ${n + 1}단계 내용`);
  });
  if (c.goals.length > L.goals)
    errors.push(`성과목표는 ${L.goals}개까지입니다.`);
  c.goals.forEach((g, n) => {
    if (!g.value.trim() || !g.label.trim())
      errors.push(`성과목표 ${n + 1}: 숫자와 설명을 모두 입력하세요.`);
    over(g.value, L.goalValue, `성과목표 ${n + 1} 숫자`);
    over(g.label, L.goalLabel, `성과목표 ${n + 1} 설명`);
  });
  if (c.items.length > L.items)
    errors.push(`공익 사업은 ${L.items}개까지입니다.`);
  c.items.forEach((i, n) => {
    if (!i.title.trim() || !i.body.trim())
      errors.push(`${n + 1}번 사업: 제목과 내용을 모두 입력하세요.`);
    over(i.title, L.itemTitle, `${n + 1}번 사업 제목`);
    over(i.body, L.itemBody, `${n + 1}번 사업 내용`);
  });
  if (c.activities.length > L.activities)
    errors.push(`활동 기록은 ${L.activities}개까지입니다.`);
  c.activities.forEach((a, n) => {
    const label = `${n + 1}번 활동`;
    if (!a.title.trim()) errors.push(`${label}: 제목을 입력하세요.`);
    over(a.title, L.itemTitle, `${label} 제목`);
    over(a.date, L.date, `${label} 날짜`);
    over(a.body, L.itemBody, `${label} 내용`);
    if (a.photos.length > L.photos)
      errors.push(`${label}: 사진은 ${L.photos}장까지입니다.`);
    a.photos.forEach((p, k) => {
      if (!isPhotoUrl(p.url))
        errors.push(
          `${label} 사진 ${k + 1}: 주소는 /social/파일.jpg 또는 https://로 시작해야 합니다.`,
        );
      over(p.caption, L.caption, `${label} 사진 ${k + 1} 설명`);
    });
  });
  // 예비사회적기업은 '사회적기업' 인증을 받은 것이 아니다 (사회적기업 육성법: 인증받지 않은 곳의 '사회적기업' 명칭 사용 금지)
  const all = [
    c.designation,
    c.mission,
    c.vision,
    ...c.items.map((i) => i.title + " " + i.body),
    ...c.activities.map((a) => a.title + " " + a.body),
  ].join(" ");
  if (
    /(?<!예비)사회적기업\s*(으로\s*)?인증/.test(all) ||
    /인증\s*사회적기업/.test(all)
  )
    errors.push(
      "'사회적기업 인증'으로 읽히는 표현은 쓰지 않습니다. 지금은 '예비사회적기업 지정'입니다.",
    );
  return errors;
}
