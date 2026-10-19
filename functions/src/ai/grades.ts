// AI 실내 마감 등급 설명·추천. 금액은 단가 DB로 계산한 값을 그대로 보여주고,
// AI는 등급별 자재 예시·이 집에 맞는 등급과 이유만 쓴다(금액을 만들거나 바꾸지 않는다).
// 이 파일은 네트워크를 쓰지 않는다(호출은 claude.ts, 테스트는 가짜 호출로).

import type { CallClaude, ToolSpec } from "./claude.js";

export const MODULES = ["A", "B", "C"] as const;
export type Module = (typeof MODULES)[number];

export interface GradeExplainInput {
  house: {
    address: string | null;
    floorArea: number | null;
    structure: string | null;
    roofStructure: string | null;
    approvalDate: string | null;
    zoning: string | null;
    // 10/14 추가 (없을 수 있다)
    floors?: number | null;
    mainPurpose?: string | null;
    roadSide?: string | null;
    terrain?: string | null;
    landUse?: string | null;
  };
  // 체크리스트 문항·답 (화면 문구 그대로)
  checklist: { question: string; answer: string }[];
  // 단가 DB로 계산한 등급별 견적 (원)
  tiers: {
    module: Module;
    grade: "하" | "중" | "상";
    name: string;
    unitPrice: number;
    total: number;
    rangeLow: number;
    rangeHigh: number;
    // 10/19: 팀이 확정한 등급 콘셉트·대표 마감 (web FINISH_TIERS). AI 자재 예시가 이것과 어긋나지 않게 한다
    concept?: string;
    finishes?: string;
  }[];
  // 숙소 운영 전제 (예: 농촌 독채 민박)
  purpose: string;
  // 실내 마감(모듈 단가)에 들어가는 범위 (web MODULE_SCOPE)
  scope?: string;
}

export interface GradeExplanation {
  recommended: Module;
  reason: string;
  tiers: { module: Module; materials: string[]; fit: string }[];
  cautions: string[];
}

const str = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : null;
const numOrNull = (v: unknown) =>
  v === null || v === undefined
    ? null
    : typeof v === "number" && Number.isFinite(v)
      ? v
      : undefined;

// 화면이 보낸 값을 검사한다. 형식이 틀리면 null
export function parseGradeInput(raw: unknown): GradeExplainInput | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const h = (r.house ?? {}) as Record<string, unknown>;
  const floorArea = numOrNull(h.floorArea);
  if (floorArea === undefined) return null;
  if (!Array.isArray(r.checklist) || r.checklist.length > 20) return null;
  if (!Array.isArray(r.tiers) || r.tiers.length !== 3) return null;
  const checklist = r.checklist.map((c) => ({
    question: str((c as Record<string, unknown>)?.question, 80) ?? "",
    answer: str((c as Record<string, unknown>)?.answer, 40) ?? "",
  }));
  const tiers = r.tiers.map((t) => {
    const x = (t ?? {}) as Record<string, unknown>;
    return {
      module: x.module as Module,
      grade: x.grade as "하" | "중" | "상",
      name: str(x.name, 20) ?? "",
      unitPrice: x.unitPrice as number,
      total: x.total as number,
      rangeLow: x.rangeLow as number,
      rangeHigh: x.rangeHigh as number,
      ...(str(x.concept, 60) ? { concept: str(x.concept, 60)! } : {}),
      ...(str(x.finishes, 120) ? { finishes: str(x.finishes, 120)! } : {}),
    };
  });
  const okTier = (t: GradeExplainInput["tiers"][number]) =>
    MODULES.includes(t.module) &&
    ["하", "중", "상"].includes(t.grade) &&
    [t.unitPrice, t.total, t.rangeLow, t.rangeHigh].every(
      (n) => typeof n === "number" && Number.isFinite(n) && n >= 0,
    );
  if (!tiers.every(okTier)) return null;
  return {
    house: {
      // 주소는 AI에 보내지 않는다 (D8 국외 이전 항목 최소화, 10/15)
      address: null,
      floorArea,
      structure: str(h.structure, 40),
      roofStructure: str(h.roofStructure, 40),
      approvalDate: str(h.approvalDate, 10),
      zoning: str(h.zoning, 40),
      floors: numOrNull(h.floors) ?? null,
      mainPurpose: str(h.mainPurpose, 40),
      roadSide: str(h.roadSide, 40),
      terrain: str(h.terrain, 40),
      landUse: str(h.landUse, 40),
    },
    checklist,
    tiers,
    purpose: str(r.purpose, 80) ?? "농촌 빈집을 고쳐 독채 숙소로 운영",
    ...(str(r.scope, 160) ? { scope: str(r.scope, 160)! } : {}),
  };
}

export const GRADE_TOOL: ToolSpec = {
  name: "grade_explanation",
  description: "실내 마감 등급(하·중·상)별 자재 예시와 이 집에 맞는 추천 등급",
  input_schema: {
    type: "object",
    properties: {
      recommended: { type: "string", enum: ["A", "B", "C"] },
      reason: {
        type: "string",
        description:
          "추천 이유 2~3문장. 집의 구조·연식·상태·숙소 운영 목적을 근거로",
      },
      tiers: {
        type: "array",
        minItems: 3,
        maxItems: 3,
        items: {
          type: "object",
          properties: {
            module: { type: "string", enum: ["A", "B", "C"] },
            materials: {
              type: "array",
              minItems: 2,
              maxItems: 5,
              items: { type: "string" },
              description:
                "그 등급의 실내 마감(바닥·벽·천장·문·조명) 자재 예시, 항목당 25자 이내. 확정 대표 마감과 같은 종류·수준으로만",
            },
            fit: {
              type: "string",
              description: "이 집에 이 등급을 쓰면 어떤지 한 문장",
            },
          },
          required: ["module", "materials", "fit"],
        },
      },
      cautions: {
        type: "array",
        maxItems: 3,
        items: { type: "string" },
        description:
          "등급과 관계없이 먼저 확인할 점 (예: 누수·구조). 없으면 빈 배열",
      },
    },
    required: ["recommended", "reason", "tiers", "cautions"],
  },
};

const won = (n: number) =>
  `${Math.round(n / 10_000).toLocaleString("ko-KR")}만 원`;

export const GRADE_SYSTEM = [
  "당신은 농촌 빈집 리모델링 견적을 돕는 건축 실무 조언가입니다.",
  "금액은 회사 단가표로 이미 계산되어 있습니다. 금액을 새로 만들거나 고치거나 다른 금액을 제시하지 마세요.",
  "자재는 일반적인 예시로만 쓰고 특정 상표·제품명은 쓰지 마세요.",
  "확실하지 않은 내용은 단정하지 말고 '현장 확인 필요'라고 쓰세요. 법적 허가 가능 여부는 판단하지 마세요.",
  "한국어로, 집주인이 이해할 수 있는 쉬운 말로 짧게 쓰세요.",
  "등급마다 회사가 확정한 '대표 마감'이 주어지면, 자재 예시는 그 대표 마감과 같은 종류·수준으로만 쓰세요. 대표 마감에 없는 다른 바닥재·벽 마감으로 바꾸거나 더 높은·낮은 등급의 자재를 섞지 마세요. 대표 마감을 조금 더 구체적으로 풀어 쓰는 것은 괜찮습니다.",
  "욕실·주방은 등급과 별개인 공정이므로 등급 자재 예시에 넣지 마세요.",
].join("\n");

export function gradePrompt(input: GradeExplainInput): string {
  const h = input.house;
  const lines = [
    `운영 목적: ${input.purpose}`,
    "",
    "[집 정보]",
    `- 연면적: ${h.floorArea ?? "미상"}㎡`,
    `- 구조: ${h.structure ?? "미상"} / 지붕: ${h.roofStructure ?? "미상"}`,
    `- 사용승인일: ${h.approvalDate ?? "미상"} / 용도지역: ${h.zoning ?? "미상"}`,
    `- 지상 층수: ${h.floors ?? "미상"} / 주용도: ${h.mainPurpose ?? "미상"}`,
    `- 도로 접면: ${h.roadSide ?? "미상"} / 지형: ${h.terrain ?? "미상"} / 토지 이용: ${h.landUse ?? "미상"}`,
    "",
    "[상태 체크리스트]",
    ...input.checklist.map((c) => `- ${c.question} → ${c.answer}`),
    "",
    "[실내 마감 등급별 견적 — 단가표 계산값, 변경 금지]",
    ...(input.scope ? [`실내 마감 범위: ${input.scope}`] : []),
    ...input.tiers.map(
      (t) =>
        `- 모듈 ${t.module} (${t.grade}·${t.name}): 실내 ㎡당 ${t.unitPrice.toLocaleString("ko-KR")}원, 전체 공사비 ${won(t.total)} (범위 ${won(t.rangeLow)}~${won(t.rangeHigh)})` +
        (t.concept ? ` / 콘셉트: ${t.concept}` : "") +
        (t.finishes
          ? ` / 대표 마감(확정, 이것과 어긋나지 않게): ${t.finishes}`
          : ""),
    ),
    "",
    "각 등급의 자재 예시(대표 마감과 같은 수준)와 이 집에 가장 맞는 등급을 추천해 주세요.",
  ];
  return lines.join("\n");
}

// AI 응답 검사. 형식이 틀리면 예외(화면에는 'AI 설명을 만들지 못했습니다')
export function parseGradeExplanation(raw: unknown): GradeExplanation {
  const r = (raw ?? {}) as Record<string, unknown>;
  const recommended = r.recommended as Module;
  if (!MODULES.includes(recommended)) throw new Error("추천 등급 형식 오류");
  const reason = str(r.reason, 400);
  if (!reason) throw new Error("추천 이유 없음");
  if (!Array.isArray(r.tiers)) throw new Error("등급 설명 형식 오류");
  const tiers = MODULES.map((m) => {
    const t = (r.tiers as Record<string, unknown>[]).find(
      (x) => x?.module === m,
    );
    if (!t || !Array.isArray(t.materials))
      throw new Error(`모듈 ${m} 설명 없음`);
    return {
      module: m,
      materials: t.materials
        .map((x) => str(x, 40))
        .filter((x): x is string => !!x)
        .slice(0, 5),
      fit: str(t.fit, 200) ?? "",
    };
  });
  const cautions = Array.isArray(r.cautions)
    ? r.cautions
        .map((x) => str(x, 120))
        .filter((x): x is string => !!x)
        .slice(0, 3)
    : [];
  return { recommended, reason, tiers, cautions };
}

export async function explainGrades(
  input: GradeExplainInput,
  call: CallClaude,
): Promise<GradeExplanation> {
  const raw = await call({
    system: GRADE_SYSTEM,
    content: [{ type: "text", text: gradePrompt(input) }],
    tool: GRADE_TOOL,
  });
  return parseGradeExplanation(raw);
}
