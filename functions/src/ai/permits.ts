// AI 인허가 안내 (RAG, 10/26). 인허가 자료(permitKnowledge, 관리 화면 /admin/permits에서 고침)에서
// 이 집에 맞는 자료를 찾아(검색) Claude에 함께 보내고, Claude는 그 자료만 근거로 항목별 안내를 쓴다(생성).
// 항목마다 근거 자료 id를 붙이게 하고, 찾은 자료에 없는 id를 붙인 항목은 버린다.
// 원칙: "가능/불가능"을 단정하지 않는다. 법적 판정이 아니다.
// 이 파일은 네트워크를 쓰지 않는다(호출은 claude.ts, 테스트는 가짜 호출로).

import type { CallClaude, ToolSpec } from "./claude.js";

export interface KnowledgeDoc {
  id: string;
  title: string;
  // 근거 법령·기관 (예: 농어촌정비법)
  source: string;
  url: string | null;
  body: string;
  // 검색용 주제 (KNOWLEDGE_TAGS)
  tags: string[];
  // 담당 팀원(원일) 검토를 마쳤는지. 화면에 '검토 전 자료'로 표시한다
  reviewed: boolean;
}

// 집 정보에서 나오는 주제. 관리 화면의 태그 고르기 목록과 같다
export const KNOWLEDGE_TAGS = [
  "민박",
  "거주",
  "면적",
  "위탁",
  "숙박업",
  "한옥",
  "용도",
  "용도지역",
  "도로",
  "무허가",
  "석면",
  "소방",
  "보험",
  "물",
  "오수",
  "지원",
] as const;

export interface PermitQuery {
  floorArea: number | null;
  structure: string | null;
  approvalDate: string | null;
  zoning: string | null;
  landUse: string | null;
  mainPurpose: string | null;
  roadSide: string | null;
  roofStructure: string | null;
  noRegistry: boolean;
  // 집주인이 살면서 운영 / 다른 사람에게 맡겨 운영 / 아직 모름
  operator: "owner" | "entrust" | "unknown";
  // 회원이 직접 묻는 말 (없으면 null)
  question: string | null;
}

export const OPERATOR_LABELS: Record<PermitQuery["operator"], string> = {
  owner: "집주인이 그 집에 살면서 운영",
  entrust: "다른 사람(운영사)에게 맡겨 운영",
  unknown: "아직 정하지 않음",
};

export type GuideLevel = "caution" | "check" | "info";

export interface PermitGuideItem {
  title: string;
  level: GuideLevel;
  explanation: string;
  nextAction: string;
  sourceIds: string[];
}

export interface PermitGuide {
  summary: string;
  items: PermitGuideItem[];
  // 자료에 없어 답하지 못한 것 (관할 기관에 물어볼 것)
  unanswered: string[];
}

export interface PermitSource {
  id: string;
  title: string;
  source: string;
  url: string | null;
  reviewed: boolean;
}

export interface PermitGuideResult extends PermitGuide {
  sources: PermitSource[];
}

const str = (v: unknown, max: number) =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;

// 화면이 보낸 값을 검사한다. 형식이 틀리면 null
export function parsePermitQuery(raw: unknown): PermitQuery | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const area = r.floorArea;
  if (
    area !== null &&
    area !== undefined &&
    !(typeof area === "number" && Number.isFinite(area) && area >= 0)
  )
    return null;
  if (typeof r.noRegistry !== "boolean") return null;
  const operator = r.operator ?? "unknown";
  if (operator !== "owner" && operator !== "entrust" && operator !== "unknown")
    return null;
  return {
    floorArea: typeof area === "number" ? area : null,
    structure: str(r.structure, 40),
    approvalDate: str(r.approvalDate, 10),
    zoning: str(r.zoning, 40),
    landUse: str(r.landUse, 40),
    mainPurpose: str(r.mainPurpose, 40),
    roadSide: str(r.roadSide, 40),
    roofStructure: str(r.roofStructure, 40),
    noRegistry: r.noRegistry,
    operator,
    question: str(r.question, 200),
  };
}

// Firestore 문서 → 자료. 형식이 틀리면 null(검색에서 뺀다)
export function parseKnowledgeDoc(
  id: string,
  d: Record<string, unknown>,
): KnowledgeDoc | null {
  const title = str(d.title, 80);
  const body = str(d.body, 2000);
  if (!title || !body) return null;
  return {
    id,
    title,
    source: str(d.source, 120) ?? "",
    url: str(d.url, 300),
    body,
    tags: Array.isArray(d.tags)
      ? d.tags.filter((t): t is string => typeof t === "string").slice(0, 10)
      : [],
    reviewed: d.reviewed === true,
  };
}

// 어느 집에나 해당하는 주제 (농어촌민박 기본 요건)
const BASE_TAGS = ["민박", "거주", "소방", "보험", "물", "오수"];

// 집 정보 → 주제 태그 (어떤 자료가 이 집에 해당하는지)
export function queryTags(q: PermitQuery): string[] {
  const tags = new Set<string>(BASE_TAGS);
  if (q.floorArea !== null && q.floorArea >= 200) tags.add("면적");
  if (q.mainPurpose && !/주택/.test(q.mainPurpose)) tags.add("용도");
  if (q.zoning || q.landUse) tags.add("용도지역");
  if (q.roadSide && /맹지|\(불\)/.test(q.roadSide)) tags.add("도로");
  if (q.roofStructure && /슬레이트/.test(q.roofStructure)) tags.add("석면");
  if (q.noRegistry) tags.add("무허가");
  if (q.operator !== "owner") {
    tags.add("위탁");
    tags.add("숙박업");
  }
  if (q.structure && /목조|한옥|목구조/.test(q.structure)) tags.add("한옥");
  return [...tags];
}

// 한글·영문·숫자 두 글자 묶음 (형태소 분석 없이 한국어 낱말 겹침을 잰다)
export function bigrams(text: string): Set<string> {
  const s = text.toLowerCase().replace(/[^0-9a-z가-힣]/g, "");
  const out = new Set<string>();
  for (let i = 0; i < s.length - 1; i++) out.add(s.slice(i, i + 2));
  return out;
}

// 낱말 겹침은 회원이 묻는 말로만 잰다 (집 정보는 위 태그로 반영)
export function queryText(q: PermitQuery): string {
  return q.question ?? "";
}

export const RETRIEVE_LIMIT = 6;

// 검색: 기본 주제 태그가 맞으면 1점, 이 집의 주의 신호 태그(맹지·슬레이트 등)가 맞으면 3점씩,
// 묻는 말과 낱말이 겹치는 비율(0~1)에 6점. 주의 신호 자료가 기본 자료에 밀리지 않게 한다.
// 점수가 0인 자료는 보내지 않는다. 같은 점수면 id 순(같은 입력이면 같은 결과)
export function retrieve(
  docs: KnowledgeDoc[],
  q: PermitQuery,
  limit = RETRIEVE_LIMIT,
): { doc: KnowledgeDoc; score: number }[] {
  const tags = new Set(queryTags(q));
  const qGrams = bigrams(queryText(q));
  return docs
    .map((doc) => {
      const tagScore = doc.tags
        .filter((t) => tags.has(t))
        .reduce((n, t) => n + (BASE_TAGS.includes(t) ? 1 : 3), 0);
      let overlap = 0;
      if (qGrams.size > 0) {
        const dGrams = bigrams(`${doc.title} ${doc.body}`);
        let hit = 0;
        for (const g of qGrams) if (dGrams.has(g)) hit++;
        overlap = hit / qGrams.size;
      }
      return { doc, score: tagScore + overlap * 6 };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.doc.id.localeCompare(b.doc.id))
    .slice(0, limit);
}

export const PERMIT_TOOL: ToolSpec = {
  name: "permit_guide",
  description: "주어진 인허가 자료만 근거로 쓴 이 집의 숙박 영업 인허가 안내",
  input_schema: {
    type: "object",
    properties: {
      summary: {
        type: "string",
        description:
          "이 집에서 먼저 확인할 인허가 쟁점 2~3문장. 가능·불가능을 단정하지 않는다",
      },
      items: {
        type: "array",
        minItems: 1,
        maxItems: 6,
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "항목 이름, 30자 이내" },
            level: {
              type: "string",
              enum: ["caution", "check", "info"],
              description:
                "caution=이 집 정보에 주의 신호가 있음, check=확인 필요, info=참고",
            },
            explanation: {
              type: "string",
              description: "이 집에 왜 해당하는지 자료를 근거로 2문장 이내",
            },
            nextAction: {
              type: "string",
              description: "집주인이 할 다음 행동 한 문장 (어디에 무엇을 확인)",
            },
            sourceIds: {
              type: "array",
              minItems: 1,
              items: { type: "string" },
              description: "근거로 쓴 자료 id (예: K1). 주어진 자료 id만",
            },
          },
          required: ["title", "level", "explanation", "nextAction", "sourceIds"],
        },
      },
      unanswered: {
        type: "array",
        maxItems: 3,
        items: { type: "string" },
        description:
          "묻는 말 중 자료에 근거가 없어 답하지 못한 것. 없으면 빈 배열",
      },
    },
    required: ["summary", "items", "unanswered"],
  },
};

export const PERMIT_SYSTEM = [
  "당신은 농촌 빈집을 숙소로 고치려는 집주인에게 인허가 확인 사항을 안내하는 도우미입니다.",
  "반드시 [인허가 자료]에 적힌 내용만 근거로 쓰세요. 자료에 없는 법 조항·숫자·기관 이름을 만들지 마세요.",
  "항목마다 근거로 쓴 자료 id를 sourceIds에 적으세요. 근거 자료가 없는 항목은 쓰지 마세요.",
  "영업이 '가능하다'거나 '불가능하다'고 단정하지 마세요. '확인이 필요합니다', '해당될 수 있습니다'처럼 쓰세요.",
  "집 정보에 주의 신호(주용도가 주택이 아님, 맹지, 슬레이트 지붕, 건축물대장 없음, 위탁 운영 등)가 있으면 그 항목을 먼저 쓰세요.",
  "회원이 묻는 말이 있으면 먼저 답하되, 자료에 근거가 없으면 unanswered에 넣고 관할 기관 확인을 권하세요.",
  "한국어로, 집주인이 이해할 수 있는 쉬운 말로 짧게 쓰세요.",
].join("\n");

export function permitPrompt(
  q: PermitQuery,
  docs: KnowledgeDoc[],
): string {
  return [
    "[집 정보]",
    `- 연면적: ${q.floorArea ?? "미상"}㎡ / 구조: ${q.structure ?? "미상"} / 사용승인일: ${q.approvalDate ?? "미상"}`,
    `- 건축물대장 주용도: ${q.noRegistry ? "대장 없음" : (q.mainPurpose ?? "미상")}`,
    `- 용도지역: ${q.zoning ?? "미상"} / 토지 이용: ${q.landUse ?? "미상"}`,
    `- 도로 접면: ${q.roadSide ?? "미상"} / 지붕: ${q.roofStructure ?? "미상"}`,
    `- 운영 방식: ${OPERATOR_LABELS[q.operator]}`,
    "",
    `[회원이 묻는 말] ${q.question ?? "없음"}`,
    "",
    "[인허가 자료]",
    ...docs.map(
      (d) =>
        `<자료 id="${d.id}" 제목="${d.title}" 출처="${d.source}">\n${d.body}\n</자료>`,
    ),
    "",
    "위 자료만 근거로, 이 집에서 숙박 영업 전에 확인할 인허가 항목을 정리해 주세요.",
  ].join("\n");
}

// AI 응답 검사. 찾은 자료에 없는 id는 지우고, 근거가 하나도 남지 않은 항목은 버린다
export function parsePermitGuide(
  raw: unknown,
  allowedIds: string[],
): PermitGuide {
  const r = (raw ?? {}) as Record<string, unknown>;
  const summary = str(r.summary, 500);
  if (!summary) throw new Error("요약 없음");
  const allowed = new Set(allowedIds);
  const items = (Array.isArray(r.items) ? r.items : [])
    .map((x): PermitGuideItem | null => {
      const it = (x ?? {}) as Record<string, unknown>;
      const title = str(it.title, 60);
      const level = it.level as GuideLevel;
      const sourceIds = Array.isArray(it.sourceIds)
        ? [
            ...new Set(
              it.sourceIds.filter(
                (s): s is string => typeof s === "string" && allowed.has(s),
              ),
            ),
          ]
        : [];
      if (!title || sourceIds.length === 0) return null;
      return {
        title,
        level: ["caution", "check", "info"].includes(level) ? level : "check",
        explanation: str(it.explanation, 300) ?? "",
        nextAction: str(it.nextAction, 200) ?? "",
        sourceIds,
      };
    })
    .filter((x): x is PermitGuideItem => x !== null)
    .slice(0, 6);
  if (items.length === 0) throw new Error("근거 있는 항목 없음");
  const unanswered = Array.isArray(r.unanswered)
    ? r.unanswered
        .map((x) => str(x, 160))
        .filter((x): x is string => !!x)
        .slice(0, 3)
    : [];
  return { summary, items, unanswered };
}

export async function guidePermits(
  q: PermitQuery,
  docs: KnowledgeDoc[],
  call: CallClaude,
): Promise<PermitGuideResult> {
  const raw = await call({
    system: PERMIT_SYSTEM,
    content: [{ type: "text", text: permitPrompt(q, docs) }],
    tool: PERMIT_TOOL,
    maxTokens: 4000,
  });
  const guide = parsePermitGuide(
    raw,
    docs.map((d) => d.id),
  );
  const cited = new Set(guide.items.flatMap((i) => i.sourceIds));
  return {
    ...guide,
    sources: docs
      .filter((d) => cited.has(d.id))
      .map(({ id, title, source, url, reviewed }) => ({
        id,
        title,
        source,
        url,
        reviewed,
      })),
  };
}

// 기본 인허가 자료 (10/26 PM 초안, 원일 검토 전). 관리 화면에서 '기본 자료 불러오기'로 저장해 고친다.
// 저장된 자료가 하나도 없으면 함수가 이 목록으로 검색한다.
// 법 조문 번호는 확인한 것만 적었다. 세부 기준은 개정될 수 있어 본문에 '관할 기관 확인'을 남긴다.
export const DEFAULT_PERMIT_KNOWLEDGE: KnowledgeDoc[] = [
  {
    id: "K01",
    title: "농어촌민박사업이란",
    source: "농어촌정비법 (정의)",
    url: "https://www.law.go.kr/법령/농어촌정비법",
    body: "농어촌민박사업은 농어촌지역 또는 준농어촌지역의 주민이 거주하고 있는 단독주택(연면적 230㎡ 미만)을 이용해 숙박·취사시설·조식 등을 제공하는 사업이다. 읍·면 지역의 농촌 빈집을 숙소로 쓸 때 가장 먼저 검토하는 인허가다. 연면적이 230㎡ 이상이거나 주택이 아니면 농어촌민박으로 신고할 수 없어 다른 인허가를 검토해야 한다.",
    tags: ["민박", "면적", "용도"],
    reviewed: false,
  },
  {
    id: "K02",
    title: "농어촌민박 신고자의 거주 요건",
    source: "농어촌정비법 (농어촌민박사업자의 신고)",
    url: "https://www.law.go.kr/법령/농어촌정비법",
    body: "농어촌민박은 신고자가 그 주택에 실제로 거주해야 하고, 관할 시·군·구에 일정 기간 이상 계속 거주해야 하는 요건이 있다. 빈집을 사서 바로 운영하려면 전입과 실제 거주 시점을 먼저 계획해야 한다. 거주 기간과 예외(귀농·귀촌인 등)는 개정될 수 있으므로 관할 시·군청 담당 부서에 확인한다.",
    tags: ["민박", "거주"],
    reviewed: false,
  },
  {
    id: "K03",
    title: "농어촌민박 신고 절차",
    source: "농어촌정비법 시행규칙",
    url: "https://www.law.go.kr/법령/농어촌정비법시행규칙",
    body: "농어촌민박사업을 하려면 시장·군수·구청장에게 신고한다. 신고서와 함께 주택의 건축물대장 등 서류를 내고, 담당 공무원이 시설·안전 기준을 확인한다. 신고가 수리되면 신고증을 받고, 이후 숙소 예약 플랫폼 등록 시 신고 번호를 요구하는 경우가 많다.",
    tags: ["민박"],
    reviewed: false,
  },
  {
    id: "K04",
    title: "민박 안전시설: 소화기·감지기·일산화탄소 경보기",
    source: "농어촌정비법 시행규칙 (농어촌민박 시설 기준)",
    url: "https://www.law.go.kr/법령/농어촌정비법시행규칙",
    body: "농어촌민박은 객실마다 소화기와 단독경보형 감지기를 갖춰야 하고, 가스·기름 보일러나 화목 난방처럼 연소 기구를 쓰면 일산화탄소 경보기를 설치해야 한다. 리모델링 견적 단계에서 이 설비 비용과 설치 위치를 함께 반영하는 것이 좋다. 세부 기준은 관할 소방서·시군청에 확인한다.",
    tags: ["민박", "소방"],
    reviewed: false,
  },
  {
    id: "K05",
    title: "영업배상책임보험 가입",
    source: "농어촌정비법 (농어촌민박 보험 가입)",
    url: "https://www.law.go.kr/법령/농어촌정비법",
    body: "농어촌민박사업자는 손님의 생명·신체·재산 피해를 보상하기 위한 배상책임보험에 가입해야 한다. 신고 전이나 영업 시작 전에 가입 시점을 확인하고, 보험료를 운영비에 넣는다.",
    tags: ["민박", "보험"],
    reviewed: false,
  },
  {
    id: "K06",
    title: "위탁 운영이면 농어촌민박이 아닐 수 있음",
    source: "농어촌정비법, 공중위생관리법",
    url: "https://www.law.go.kr/법령/공중위생관리법",
    body: "농어촌민박은 거주하는 주민이 운영하는 것이 전제라서, 집주인이 살지 않고 운영사에 맡겨 운영하면 농어촌민박 요건에 맞지 않을 수 있다. 이 경우 공중위생관리법의 숙박업 영업신고나 관광진흥법의 한옥체험업 등 다른 인허가를 검토한다. 숙박업은 건축물 용도가 숙박시설이어야 하는 등 요건이 더 까다롭다.",
    tags: ["위탁", "숙박업", "거주"],
    reviewed: false,
  },
  {
    id: "K07",
    title: "숙박업 영업신고와 건축물 용도",
    source: "공중위생관리법 (영업신고), 건축법 (용도변경)",
    url: "https://www.law.go.kr/법령/공중위생관리법",
    body: "숙박업을 하려면 시장·군수·구청장에게 영업신고를 해야 하며, 건축물의 용도가 숙박시설에 맞아야 한다. 주택을 숙박시설로 바꾸려면 건축법에 따른 용도변경 허가·신고가 필요할 수 있고, 용도지역에 따라 숙박시설이 허용되지 않을 수도 있다. 시군청 건축 부서와 위생 부서에 함께 확인한다.",
    tags: ["숙박업", "용도", "용도지역"],
    reviewed: false,
  },
  {
    id: "K08",
    title: "한옥체험업",
    source: "관광진흥법 시행령 (관광편의시설업)",
    url: "https://www.law.go.kr/법령/관광진흥법시행령",
    body: "한옥체험업은 한옥에 숙박 체험 등 한국 전통문화 체험 시설을 갖춰 관광객에게 이용하게 하는 업으로, 시장·군수·구청장의 지정을 받는다. 목조 구조와 한식 기와 등 한옥에 해당하는지가 먼저 확인할 점이다. 농어촌민박 요건(거주 등)에 맞지 않는 한옥이라면 검토할 수 있다.",
    tags: ["한옥", "위탁", "숙박업"],
    reviewed: false,
  },
  {
    id: "K09",
    title: "건축물 주용도가 주택이 아닌 경우",
    source: "건축법 (용도변경)",
    url: "https://www.law.go.kr/법령/건축법",
    body: "건축물대장의 주용도가 단독주택이 아니면(예: 창고, 근린생활시설, 축사) 농어촌민박을 바로 신고할 수 없다. 단독주택으로 용도변경이 필요할 수 있고, 용도변경에는 구조·설비 기준을 맞추는 공사가 따를 수 있다. 시군청 건축 부서에 용도변경 가능 여부와 절차를 확인한다.",
    tags: ["용도", "민박"],
    reviewed: false,
  },
  {
    id: "K10",
    title: "용도지역과 숙박 영업",
    source: "국토의 계획 및 이용에 관한 법률 (용도지역)",
    url: "https://www.law.go.kr/법령/국토의계획및이용에관한법률",
    body: "땅의 용도지역(예: 계획관리지역, 생산관리지역, 보전관리지역, 농림지역, 자연녹지지역)에 따라 지을 수 있는 건축물이 다르다. 단독주택을 쓰는 농어촌민박은 대체로 영향이 적지만, 숙박시설로 용도를 바꾸거나 증축할 때는 용도지역에서 허용되는지 확인해야 한다. 토지이용계획확인서(토지이음)에서 용도지역과 다른 규제를 함께 본다.",
    tags: ["용도지역", "숙박업"],
    reviewed: false,
  },
  {
    id: "K11",
    title: "도로에 접하지 않은 땅(맹지)·좁은 길",
    source: "건축법 제44조 (대지와 도로의 관계)",
    url: "https://www.law.go.kr/법령/건축법",
    body: "건축물의 대지는 원칙적으로 2m 이상 도로에 접해야 한다. 맹지는 신축·증축 허가가 어려울 수 있고, 수선 공사도 공사 차량 진입과 자재 운반에 비용이 더 든다. 차량 통행이 어려운 길(세로(불) 등)에 접한 땅도 진입 방법을 미리 확인한다. 진입로 사용 동의나 도로 확보 방법은 현장진단과 시군청 건축 부서에서 함께 확인한다.",
    tags: ["도로"],
    reviewed: false,
  },
  {
    id: "K12",
    title: "건축물대장이 없는 집(무허가·미등기)",
    source: "건축법, 농어촌정비법",
    url: "https://www.law.go.kr/법령/건축법",
    body: "건축물대장이 없는 무허가·미등기 건물은 농어촌민박 신고에 필요한 서류를 갖추기 어렵고, 대수선·증축 허가도 받기 어렵다. 먼저 양성화(사용승인·대장 등재)가 가능한지 확인해야 하며, 시기에 따라 한시적 양성화 특례가 운영되기도 한다. 시군청 건축 부서에 확인한다.",
    tags: ["무허가", "민박"],
    reviewed: false,
  },
  {
    id: "K13",
    title: "석면 슬레이트 지붕 처리",
    source: "석면안전관리법",
    url: "https://www.law.go.kr/법령/석면안전관리법",
    body: "석면 슬레이트 지붕은 등록된 석면 해체·제거 업체가 정해진 절차로 철거해야 하며, 집주인이 직접 철거하면 안 된다. 환경부와 지자체가 슬레이트 철거·처리 비용을 지원하는 사업을 해마다 운영하므로, 지원 대상인지와 신청 시기를 시군청 환경 부서에 확인한다.",
    tags: ["석면", "지원"],
    reviewed: false,
  },
  {
    id: "K14",
    title: "먹는 물: 지하수 수질검사",
    source: "먹는물관리법, 농어촌정비법 시행규칙",
    url: "https://www.law.go.kr/법령/먹는물관리법",
    body: "상수도가 없는 집에서 지하수를 먹는 물로 쓰면 수질검사를 받아 기준에 맞는지 확인해야 한다. 민박 신고 때 수질검사 결과를 요구하는 지자체가 있으므로, 상수도 연결 여부와 함께 확인한다.",
    tags: ["물", "민박"],
    reviewed: false,
  },
  {
    id: "K15",
    title: "오수 처리: 정화조(개인하수처리시설) 용량",
    source: "하수도법 (개인하수처리시설)",
    url: "https://www.law.go.kr/법령/하수도법",
    body: "공공하수도가 없는 지역은 정화조 같은 개인하수처리시설로 오수를 처리한다. 객실·욕실을 늘리거나 숙박 인원이 많아지면 처리 용량이 부족할 수 있어, 리모델링 전에 기존 정화조 용량과 상태를 확인하고 필요하면 교체 비용을 견적에 넣는다. 시군청 환경 부서에 기준을 확인한다.",
    tags: ["오수"],
    reviewed: false,
  },
  {
    id: "K16",
    title: "빈집 정비·귀촌 지원사업",
    source: "농어촌정비법 (빈집 정비), 지자체 지원사업",
    url: null,
    body: "시·군은 농어촌 빈집 정비와 귀농·귀촌인 주택 수리를 지원하는 사업을 운영하기도 한다. 지원 대상·금액·신청 시기는 지자체마다 해마다 다르므로, 공사 전에 시군청 담당 부서나 귀농귀촌지원센터에 확인한다. 공사를 먼저 하면 지원 대상에서 빠질 수 있다.",
    tags: ["지원"],
    reviewed: false,
  },
];
