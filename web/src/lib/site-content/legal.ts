// 이용약관·개인정보 처리방침·사업자 정보 (siteContent/terms·privacy·company, 11/4).
// 본문 기본값은 D8 확정본(10/20, 원일 검토)을 공개용으로 옮긴 것이다. 관리 화면 '약관·사업자 정보'에서 고친다.
// 개인정보보호법 제30조: 처리방침은 누구나 볼 수 있게 공개해야 한다 → 바닥글에 링크.
// 이 파일은 React·Firebase를 import하지 않는다.

export type LegalKind = "terms" | "privacy";

export interface LegalDoc {
  // 시행일 (화면 표시용 글자, 예: 2026년 11월 4일)
  effectiveDate: string;
  // 간단한 표시 규칙의 본문 (parseLegalText 참고)
  body: string;
}

// 바닥글과 약관 빈칸({운영주체} 등)에 쓰는 사업자 정보. 빈 칸은 화면에서 뺀다.
export interface CompanyInfo {
  operator: string; // 상호(운영 주체)
  ceo: string; // 대표자
  bizNumber: string; // 사업자등록번호
  mailOrderNumber: string; // 통신판매업 신고번호
  address: string; // 사업장 주소
  phone: string;
  email: string;
  privacyOfficer: string; // 개인정보 보호책임자 이름·직책
  privacyContact: string; // 보호책임자 연락처
  copyright: string;
}

export const COMPANY_FIELDS: {
  key: keyof CompanyInfo;
  label: string;
  hint?: string;
}[] = [
  {
    key: "operator",
    label: "상호(운영 주체)",
    hint: "사업자 등록 전이면 '온기로 팀'",
  },
  { key: "ceo", label: "대표자" },
  {
    key: "bizNumber",
    label: "사업자등록번호",
    hint: "없으면 비워 두면 바닥글에 안 보입니다",
  },
  {
    key: "mailOrderNumber",
    label: "통신판매업 신고번호",
    hint: "없으면 비워 둡니다",
  },
  { key: "address", label: "사업장 주소" },
  { key: "phone", label: "대표 전화" },
  { key: "email", label: "대표 이메일" },
  { key: "privacyOfficer", label: "개인정보 보호책임자 (이름·직책)" },
  { key: "privacyContact", label: "보호책임자 연락처 (이메일·전화)" },
  { key: "copyright", label: "저작권 표시" },
];

export const COMPANY_MAX = 120;
export const LEGAL_BODY_MAX = 20000;
export const EFFECTIVE_DATE_MAX = 30;

export const DEFAULT_COMPANY: CompanyInfo = {
  operator: "온기로 팀",
  ceo: "장상민",
  bizNumber: "",
  mailOrderNumber: "",
  address: "",
  phone: "010-2761-3187",
  email: "",
  privacyOfficer: "장상민 (대표·PM)",
  privacyContact: "010-2761-3187",
  copyright: "© 2026 온기로. All rights reserved.",
};

// 본문 표시 규칙: '# ' 큰 제목, '## ' 작은 제목, '- ' 글머리 목록, '1. ' 번호 목록,
// '| 칸 | 칸 |' 표(첫 줄이 머리글), '**굵게**', 빈 줄로 문단 구분.
// {운영주체} {대표자} {보호책임자} {보호책임자연락처} {이메일} {전화} {시행일} 은 저장된 값으로 바뀐다.
export const DEFAULT_TERMS: LegalDoc = {
  effectiveDate: "2026년 11월 4일",
  body: `# 제1조 (목적)
이 약관은 {운영주체}(이하 "온기로")가 제공하는 빈집 진단·공사비 추정·운영 수익 시뮬레이션·상담·숙소 안내 서비스(이하 "서비스")의 이용 조건과 절차를 정합니다.

# 제2조 (서비스 내용)
1. 빈집 진단: 회원이 입력한 주소·건물 정보·사진·체크리스트로 공정별 공사비와 공사기간을 추정합니다.
2. 운영 수익 시뮬레이션: 숙박 운영 시 월 매출·운영비·운영비 차감 후 추정액을 세 가지 가동률 가정으로 보여줍니다.
3. 리포트: 계산 결과를 저장하고 PDF로 내려받게 합니다.
4. 상담: 현장진단, 턴키 PM, 빈집 위탁 운영 상담을 접수하고 연락합니다.
5. 숙소 안내·예약 신청: 온기로가 운영하는 숙소를 소개하고, 서비스에서 예약을 신청하거나 외부 예약 사이트로 연결합니다. 서비스의 예약 신청은 운영팀이 확정해야 성립하며, 서비스에서 결제를 받지 않습니다. 외부 사이트의 예약·결제는 해당 사이트의 약관을 따릅니다.
6. AI 기능: 회원이 따로 동의하고 버튼을 누른 경우에만 사진 분석, 실내 마감 등급 설명, 리모델링 가상 이미지, 인허가 안내를 제공합니다. AI 결과는 참고용입니다.

# 제3조 (회원 가입과 탈퇴)
1. 회원은 카카오 계정으로 로그인하고 필수 항목에 동의해 가입합니다. 필수 동의 전에는 진단을 시작할 수 없습니다.
2. 약관이 바뀌면 다음 로그인 때 다시 동의를 받습니다. 다시 동의하기 전에는 새 진단과 상담 신청을 할 수 없고, 기존 진단·리포트는 볼 수 있습니다.
3. 회원은 개인정보 보호책임자({보호책임자연락처})에게 탈퇴와 개인정보 삭제를 요청할 수 있습니다. 법령상 보관 의무가 있는 정보는 그 기간 동안 보관합니다.

# 제4조 (견적과 수익의 성격)
1. 서비스가 보여주는 공사비·공사기간·수익은 회원이 입력한 정보와 온기로의 기준값으로 계산한 **추정치**이며, 견적서·계약 제안이나 수익 보장이 아닙니다.
2. 실제 공사비는 현장진단 후 확정됩니다. 수익 추정액은 운영비 차감 후 금액이며 세금·금융비용·대규모 수선비를 빼지 않은 값입니다.
3. 숙박 영업 간이 확인은 확인할 항목을 안내할 뿐 법적 판정이 아닙니다. 영업 가능 여부는 관할 기관이 확정합니다.
4. 계산 결과는 계산 기준일과 적용 버전과 함께 저장하며, 이후 기준값이 바뀌어도 저장된 결과는 바뀌지 않습니다.

# 제5조 (상담과 위탁)
상담 신청은 계약이 아닙니다. 현장진단·턴키 PM·위탁 운영의 조건과 비용은 별도 계약으로 정합니다. 공동상속 주택은 계약 단계에서 다른 상속인의 동의서를 받습니다.

# 제6조 (회원의 의무)
회원은 본인이 진단할 권한이 있는 주택에 대해 사실대로 입력합니다. 타인의 개인정보나 주택 내부의 타인이 식별되는 사진을 올리지 않습니다.

# 제7조 (책임 제한)
온기로는 추정치와 실제 비용·수익의 차이, 회원이 잘못 입력한 정보, 외부 공공 데이터의 오류로 생긴 손해에 대해 고의·중과실이 없는 한 책임을 지지 않습니다.

# 제8조 (분쟁 해결)
분쟁은 {운영주체} 소재지 관할 법원을 관할로 합니다.

# 부칙
이 약관은 {시행일}부터 적용합니다.`,
};

export const DEFAULT_PRIVACY: LegalDoc = {
  effectiveDate: "2026년 11월 4일",
  body: `{운영주체}(이하 "온기로")는 서비스에 꼭 필요한 정보만 받고, 목적이 끝나면 지체 없이 파기합니다. 아래 항목은 실제로 저장되는 정보 기준입니다.

# 1. 수집 항목·목적·보관 기간
| 구분 | 항목 | 목적 | 보관 기간 |
| 회원 (필수) | 카카오 회원 식별자, 닉네임 | 로그인, 본인 진단·상담 구분 | 탈퇴 시까지 |
| 회원 (선택) | 카카오 이메일 | 상담 결과 안내 | 탈퇴 시까지 |
| 동의 기록 | 동의 항목·약관 버전·동의 시각 | 동의 사실 증명 | 탈퇴 후 3년 |
| 빈집 진단 | 주소(도로명·지번), 필지번호·좌표, 건물 정보(면적·구조·연식 등), 상태 체크리스트, 계산 결과 | 공사비·수익 추정, 리포트, 상담 연결 | 탈퇴 또는 삭제 요청 시까지 |
| 진단 사진 | 부위별 사진(위치정보·촬영 기기 정보 제거) | 견적 검수, 현장 확인 판단 | 상담 미신청 시 마지막 이용 후 1년, 계약 시 계약 종료 후 3년 |
| 상담 | 신청인 이름, 연락처, 소유 관계, 희망 연락일, 메모 | 상담 연락·진행 | 상담 종료 후 3년 |
| 숙소 예약 신청 | 예약자 이름, 연락처, 숙박 날짜, 인원, 요청 사항, 예상 금액 | 예약 확인·확정 연락, 입금·체크인 안내 | 이용(체크아웃) 후 3년 |
| 의견 보내기 | 의견 내용, 보낸 화면, 로그인한 경우 회원 식별자 | 서비스 개선 | 반영 완료 후 1년 |
| 이용 기록 | 화면 이용·버튼 클릭 기록(Google Analytics for Firebase), 기기·브라우저 정보, 접속 기록 | 서비스 개선, 오류 확인 | 14개월 (접속 기록은 3개월) |

- 만 14세 미만은 가입할 수 없습니다.
- 주소 등 빈집 정보는 건축물대장·토지 정보를 조회하려고 공공 기관 API(행정안전부 도로명주소, 국토교통부 건축물대장, 브이월드, 한국관광공사 TourAPI)에 보냅니다. 이때 회원의 이름·연락처는 보내지 않습니다.

# 2. 제3자 제공
온기로는 회원의 개인정보를 제3자에게 제공하지 않습니다. 법령에 따라 수사기관 등이 요구하는 경우는 예외입니다.

# 3. 처리 위탁
| 수탁자 | 위탁 업무 | 처리 위치 |
| Google LLC (Firebase) | 회원 인증, 데이터·사진 저장, 서버 기능, 이용 분석, AI 리모델링 가상 이미지(Vertex AI) | 데이터·사진: 대한민국 서울. 웹 서버: 대만. 이용 분석: 미국. AI 이미지: 미국 등 |
| 주식회사 카카오 | 카카오 로그인 | 대한민국 |
| Anthropic, PBC (Claude API) | AI 사진 분석, AI 실내 마감 등급 설명, AI 인허가 안내 | 미국 |

# 4. 국외 이전
아래 경우에 개인정보가 국외에서 처리됩니다. 이전 방법은 모두 암호화된 네트워크 전송입니다.

| 이전받는 자 | 국가 | 이전 항목 | 목적 | 이전 시점 | 보유 기간 |
| Google LLC | 대만(웹 서버), 미국(이용 분석·AI 이미지) | 접속 정보, 화면 이용 기록, 외관 정면 사진(AI 이미지를 만들 때만) | 웹 서비스 제공, 이용 분석, AI 리모델링 가상 이미지 | 서비스 이용 시 | 1절 표와 같음 |
| Anthropic, PBC | 미국 | 진단 사진(위치정보 제거본), 빈집 정보(구조·연식·면적·용도지역 등), 체크리스트 답, 등급별 견적 금액, 인허가 질문 | AI 사진 분석, AI 등급 설명, AI 인허가 안내 | 회원이 AI 버튼을 누를 때 | 처리 후 Anthropic 상업 이용 약관에 따름(모델 학습에 쓰지 않음) |

AI 기능은 선택 동의이며, 동의하지 않거나 버튼을 누르지 않으면 국외 AI 서비스로 아무것도 보내지 않습니다. 진단·견적·리포트는 그대로 이용할 수 있습니다. 주소와 회원의 이름·연락처는 AI 서비스로 보내지 않습니다.

# 5. 진단 사진
- 회원의 브라우저에서 사진의 위치정보(GPS)·촬영 일시·기기 정보를 지운 뒤 올립니다. 원본 위치정보는 온기로 서버에 도착하지 않습니다.
- 사진은 올린 회원 본인, 관리자, 권한이 있는 검수 담당자와 해당 진단의 상담 담당자만 볼 수 있습니다.
- 선택 동의한 경우에만 개인을 알아볼 수 없게 처리해 견적 정확도 개선에 씁니다.
- 사람 얼굴, 차량 번호판, 주소가 드러나는 문패·우편물 등은 올리지 마세요.

# 6. 파기 절차와 방법
보관 기간이 끝나거나 처리 목적이 달성된 정보는 지체 없이 파기합니다. 전자 파일은 복구할 수 없는 방법으로 지우고, 종이 문서는 분쇄합니다. 법령에 따라 보관해야 하는 정보는 다른 정보와 분리해 그 기간 동안만 보관합니다.

# 7. 정보주체의 권리와 행사 방법
회원은 언제든 개인정보 열람·정정·삭제·처리 정지를 요청할 수 있고, 선택 동의(사진 모델 개선, AI 기능)는 마이페이지에서 철회할 수 있습니다. 요청은 개인정보 보호책임자에게 하며 10일 안에 처리합니다. 작성 중인 진단은 마이페이지에서 직접 지울 수 있고, 완료된 진단은 이 요청 절차로 삭제합니다.

# 8. 자동 수집 장치
서비스 개선을 위해 Google Analytics for Firebase로 화면 이용 기록을 모읍니다. 브라우저 설정에서 쿠키·사이트 데이터 저장을 막으면 수집을 거부할 수 있으며, 로그인 등 일부 기능이 제한될 수 있습니다.

# 9. 안전성 확보 조치
- 운영팀은 역할별 권한으로만 접근합니다. 예를 들어 사진은 권한이 있는 검수 담당자만 봅니다.
- 기준값·권한 변경과 상담 처리 이력을 기록합니다.
- 통신은 암호화(HTTPS)합니다.

# 10. 개인정보 보호책임자
- 보호책임자: {보호책임자}
- 연락처: {보호책임자연락처}

침해 신고·상담은 개인정보분쟁조정위원회(1833-6972), 개인정보침해신고센터(118)에도 할 수 있습니다.

# 11. 처리방침의 변경
이 개인정보 처리방침은 {시행일}부터 적용합니다. 내용이 바뀌면 시행 7일 전부터 서비스에 알리고, 중요한 변경은 다시 동의를 받습니다.`,
};

export const DEFAULT_LEGAL: Record<LegalKind, LegalDoc> = {
  terms: DEFAULT_TERMS,
  privacy: DEFAULT_PRIVACY,
};

export const LEGAL_TITLE: Record<LegalKind, string> = {
  terms: "이용약관",
  privacy: "개인정보 처리방침",
};

const str = (v: unknown, max: number) =>
  typeof v === "string" ? v.slice(0, max).trim() : "";

// 저장값 → 화면에 쓸 내용 (문서가 없거나 본문이 비면 기본 문구)
export function readLegalDoc(kind: LegalKind, raw: unknown): LegalDoc {
  const def = DEFAULT_LEGAL[kind];
  if (!raw || typeof raw !== "object") return def;
  const r = raw as Record<string, unknown>;
  const body = str(r.body, LEGAL_BODY_MAX);
  if (!body) return def;
  return {
    effectiveDate:
      str(r.effectiveDate, EFFECTIVE_DATE_MAX) || def.effectiveDate,
    body,
  };
}

export function readCompany(raw: unknown): CompanyInfo {
  if (!raw || typeof raw !== "object") return DEFAULT_COMPANY;
  const r = raw as Record<string, unknown>;
  const out = { ...DEFAULT_COMPANY };
  for (const { key } of COMPANY_FIELDS) {
    // 저장된 적이 있는 칸은 빈 값도 그대로 쓴다(지운 값이 기본값으로 돌아오지 않게)
    if (typeof r[key] === "string") out[key] = str(r[key], COMPANY_MAX);
  }
  return out;
}

export function validateLegalDoc(d: LegalDoc): string[] {
  const errors: string[] = [];
  if (!d.effectiveDate.trim()) errors.push("시행일을 입력하세요.");
  if (d.effectiveDate.length > EFFECTIVE_DATE_MAX)
    errors.push(`시행일은 ${EFFECTIVE_DATE_MAX}자까지입니다.`);
  if (!d.body.trim()) errors.push("본문을 입력하세요.");
  if (d.body.length > LEGAL_BODY_MAX)
    errors.push(`본문은 ${LEGAL_BODY_MAX.toLocaleString()}자까지입니다.`);
  const unknown = [...d.body.matchAll(/\{([^{}\s]{1,20})\}/g)]
    .map((m) => m[1])
    .filter((k) => !(k in PLACEHOLDER_KEYS));
  if (unknown.length)
    errors.push(
      `알 수 없는 빈칸: ${[...new Set(unknown)].map((k) => `{${k}}`).join(", ")}`,
    );
  return errors;
}

export function validateCompany(c: CompanyInfo): string[] {
  const errors: string[] = [];
  if (!c.operator.trim()) errors.push("상호(운영 주체)를 입력하세요.");
  if (!c.privacyOfficer.trim())
    errors.push("개인정보 보호책임자를 입력하세요(처리방침 필수 항목).");
  if (!c.privacyContact.trim())
    errors.push("보호책임자 연락처를 입력하세요(처리방침 필수 항목).");
  for (const { key, label } of COMPANY_FIELDS)
    if (c[key].length > COMPANY_MAX)
      errors.push(`${label}은(는) ${COMPANY_MAX}자까지입니다.`);
  return errors;
}

const PLACEHOLDER_KEYS = {
  운영주체: "operator",
  대표자: "ceo",
  보호책임자: "privacyOfficer",
  보호책임자연락처: "privacyContact",
  이메일: "email",
  전화: "phone",
  시행일: null,
} as const;

// {운영주체} 같은 빈칸을 사업자 정보·시행일로 채운다. 값이 비어 있으면 '(미정)'
export function fillPlaceholders(
  text: string,
  company: CompanyInfo,
  effectiveDate: string,
): string {
  return text.replace(/\{([^{}\s]{1,20})\}/g, (whole, k: string) => {
    if (!(k in PLACEHOLDER_KEYS)) return whole;
    const field = PLACEHOLDER_KEYS[k as keyof typeof PLACEHOLDER_KEYS];
    const v = field ? company[field] : effectiveDate;
    return v.trim() || "(미정)";
  });
}

export type LegalBlock =
  | { type: "h2" | "h3" | "p"; text: string }
  | { type: "ul" | "ol"; items: string[] }
  | { type: "table"; head: string[]; rows: string[][] };

// 본문 글 → 화면 블록 (표시 규칙은 위 DEFAULT_TERMS 주석)
export function parseLegalText(text: string): LegalBlock[] {
  const blocks: LegalBlock[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ type: "p", text: para.join(" ") });
    para = [];
  };
  const cells = (line: string) =>
    line
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim());

  for (const raw of text.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();
    const last = blocks[blocks.length - 1];
    if (!line) {
      flush();
      continue;
    }
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^(#{1,2})\s+(.*)$/))) {
      flush();
      blocks.push({ type: m[1].length === 1 ? "h2" : "h3", text: m[2] });
    } else if ((m = line.match(/^-\s+(.*)$/))) {
      flush();
      if (last?.type === "ul") last.items.push(m[1]);
      else blocks.push({ type: "ul", items: [m[1]] });
    } else if ((m = line.match(/^\d+\.\s+(.*)$/))) {
      flush();
      if (last?.type === "ol") last.items.push(m[1]);
      else blocks.push({ type: "ol", items: [m[1]] });
    } else if (line.startsWith("|")) {
      flush();
      // 구분 줄(|---|---|)은 건너뛴다
      if (/^\|[\s|:-]+\|?$/.test(line)) continue;
      if (last?.type === "table") last.rows.push(cells(line));
      else blocks.push({ type: "table", head: cells(line), rows: [] });
    } else {
      para.push(line);
    }
  }
  flush();
  return blocks;
}

// '**굵게**' → 조각 (화면에서 <b>로 그린다)
export function splitBold(text: string): { text: string; bold: boolean }[] {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((t) =>
      t.startsWith("**") && t.endsWith("**") && t.length > 4
        ? { text: t.slice(2, -2), bold: true }
        : { text: t, bold: false },
    );
}

// 바닥글 사업자 정보 줄 (빈 칸은 뺀다)
export function companyLines(c: CompanyInfo): string[] {
  const pairs: [string, string][] = [
    ["상호", c.operator],
    ["대표", c.ceo],
    ["사업자등록번호", c.bizNumber],
    ["통신판매업 신고", c.mailOrderNumber],
    ["주소", c.address],
    ["전화", c.phone],
    ["이메일", c.email],
    ["개인정보 보호책임자", c.privacyOfficer],
  ];
  return pairs.filter(([, v]) => v.trim()).map(([k, v]) => `${k} ${v}`);
}
