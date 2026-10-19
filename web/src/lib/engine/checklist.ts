// 상태 체크리스트 → 공정별 상태 판정·위험 신호 (SIM-07, 08, 10, task.md 3.7).
// 판정 기준(D4)은 코드가 아니라 단가 DB 버전의 판정표(PriceTable.checklistRules)에 있다.
// 석원이 관리자 화면 단가 DB 초안에서 입력하고 PM이 적용한다(두 사람 확인). 이 파일은 판정표를 적용만 한다.
// 이 파일은 React·Firebase를 import하지 않는다. 입력과 판정표가 같으면 결과가 항상 같다.

import type {
  ChecklistRule,
  ConditionGrade,
  ProcessId,
  RiskFlagId,
} from "./types";

export type { ChecklistRule, RiskFlagId } from "./types";

// 11문항과 선택지 (목업 sim-check 10문항 + 10/19 지붕 붕괴). 화면(6.5)이 이 목록을 그대로 그린다.
// 문구를 바꿀 때는 id는 그대로 두고 label만 바꾼다. id는 저장된 진단 데이터에 남는다.
export const CHECKLIST_QUESTIONS = [
  {
    id: "leak",
    label: "비가 새는 곳이 있나요?",
    options: [
      { id: "yes", label: "예" },
      { id: "no", label: "아니오" },
      { id: "unknown", label: "모름" },
    ],
  },
  {
    // 10/19 추가(석원 확정): 위험 신호 '지붕 붕괴'를 판정하는 문항
    id: "roofHole",
    label: "지붕이 내려앉거나 구멍 난 곳이 있나요?",
    options: [
      { id: "yes", label: "예" },
      { id: "no", label: "아니오" },
      { id: "unknown", label: "모름" },
    ],
  },
  {
    id: "water",
    label: "수도가 연결되어 있나요?",
    options: [
      { id: "yes", label: "예" },
      { id: "no", label: "아니오" },
      { id: "unknown", label: "모름" },
    ],
  },
  {
    id: "power",
    label: "전기가 들어오나요?",
    options: [
      { id: "yes", label: "예" },
      { id: "no", label: "아니오" },
      { id: "unknown", label: "모름" },
    ],
  },
  {
    id: "septic",
    label: "정화조가 있나요?",
    options: [
      { id: "yes", label: "예" },
      { id: "no", label: "아니오" },
      { id: "unknown", label: "모름" },
    ],
  },
  {
    id: "lastOccupied",
    label: "마지막으로 사람이 산 때는?",
    options: [
      { id: "within1y", label: "1년 이내" },
      { id: "1to5y", label: "1~5년" },
      { id: "5to10y", label: "5~10년" },
      { id: "over10y", label: "10년 이상" },
    ],
  },
  {
    id: "crack",
    label: "벽이나 기둥에 금이 간 곳이 있나요?",
    options: [
      { id: "none", label: "없음" },
      { id: "hairline", label: "가는 금" },
      { id: "wide", label: "손가락 들어갈 정도" },
    ],
  },
  {
    id: "tilt",
    label: "집이 한쪽으로 기울어 보이나요?",
    options: [
      { id: "no", label: "아니오" },
      { id: "slight", label: "조금" },
      { id: "severe", label: "많이" },
    ],
  },
  {
    id: "bathroom",
    label: "욕실 상태는?",
    options: [
      { id: "usable", label: "쓸 만함" },
      { id: "partial", label: "일부 수리" },
      { id: "full", label: "전면 교체" },
    ],
  },
  {
    id: "kitchen",
    label: "주방 상태는?",
    options: [
      { id: "usable", label: "쓸 만함" },
      { id: "partial", label: "일부 수리" },
      { id: "full", label: "전면 교체" },
    ],
  },
  {
    id: "heating",
    label: "난방 방식은?",
    options: [
      { id: "oil", label: "기름보일러" },
      { id: "briquette", label: "연탄·아궁이" },
      { id: "electric", label: "전기" },
      { id: "none", label: "없음" },
    ],
  },
] as const;

type Question = (typeof CHECKLIST_QUESTIONS)[number];
export type QuestionId = Question["id"];

// 문항별로 고를 수 있는 답. 예: answers.crack은 "none" | "hairline" | "wide"
export type ChecklistAnswers = {
  [Q in Question as Q["id"]]: Q["options"][number]["id"];
};

export const RISK_FLAG_LABELS: Record<RiskFlagId, string> = {
  majorCrack: "큰 균열",
  severeTilt: "심한 기울어짐",
  roofCollapse: "지붕 붕괴",
};

export interface RiskFlag {
  id: RiskFlagId;
  // 어떤 답 때문에 떴는지 (결과 화면 "근거"에 그대로 보인다)
  reason: string;
}

export interface ChecklistResult {
  // 공정별 상태. 판정하지 않은 공정은 넣지 않는다(견적 엔진이 양호로 본다)
  conditions: Partial<Record<ProcessId, ConditionGrade>>;
  riskFlags: RiskFlag[];
  // "모름" 답 개수 → 견적 불확실도 가산 (EstimateInput.unknownAnswers)
  unknownAnswers: number;
}

// 판정표가 없는 단가 버전에 쓰는 기본 판정표.
// 욕실·주방은 답이 곧 상태이고, 위험 신호 두 줄은 PRD(task.md 7.2)에 적힌 기준이다.
// 나머지 문항(누수, 수도, 전기 등)은 D4(석원)로 관리자 화면에서 채운다.
export const DEFAULT_CHECKLIST_RULES: ChecklistRule[] = [
  {
    question: "bathroom",
    answer: "usable",
    process: "bathroom",
    grade: "good",
    risk: null,
  },
  {
    question: "bathroom",
    answer: "partial",
    process: "bathroom",
    grade: "partial",
    risk: null,
  },
  {
    question: "bathroom",
    answer: "full",
    process: "bathroom",
    grade: "full",
    risk: null,
  },
  {
    question: "kitchen",
    answer: "usable",
    process: "kitchen",
    grade: "good",
    risk: null,
  },
  {
    question: "kitchen",
    answer: "partial",
    process: "kitchen",
    grade: "partial",
    risk: null,
  },
  {
    question: "kitchen",
    answer: "full",
    process: "kitchen",
    grade: "full",
    risk: null,
  },
  {
    question: "crack",
    answer: "wide",
    process: null,
    grade: null,
    risk: "majorCrack",
  },
  {
    question: "tilt",
    answer: "severe",
    process: null,
    grade: null,
    risk: "severeTilt",
  },
];

function labelOf(questionId: string, answerId: string) {
  const q = CHECKLIST_QUESTIONS.find((x) => x.id === questionId);
  const a = q?.options.find((o) => o.id === answerId);
  return `${q?.label ?? questionId} → ${a?.label ?? answerId}`;
}

// D4 판정표 (10/19 석원 확정, 팀원결정권장안.md). 관리 화면 '권장안 불러오기'로 초안에 넣는다.
// 10년 이상 빈 집은 배선·배관·단열이 수명을 다했다고 보고, '모름'은 보수 쪽으로 판정해 견적이 낮게 나오는 것을 막는다.
const rule = (
  question: string,
  answer: string,
  process: ProcessId | null,
  grade: ConditionGrade | null,
  risk: RiskFlagId | null = null,
): ChecklistRule => ({ question, answer, process, grade, risk });

export const RECOMMENDED_CHECKLIST_RULES: ChecklistRule[] = [
  rule("leak", "yes", "roof", "partial"),
  rule("leak", "unknown", "roof", "partial"),
  rule("roofHole", "yes", "roof", "full", "roofCollapse"),
  rule("roofHole", "unknown", "roof", "partial"),
  rule("water", "no", "electrical", "partial"),
  rule("power", "no", "electrical", "partial"),
  rule("septic", "no", "electrical", "full"),
  rule("septic", "unknown", "electrical", "partial"),
  rule("lastOccupied", "5to10y", "electrical", "partial"),
  rule("lastOccupied", "5to10y", "insulation", "partial"),
  rule("lastOccupied", "over10y", "electrical", "full"),
  rule("lastOccupied", "over10y", "insulation", "full"),
  rule("crack", "hairline", "structure", "partial"),
  rule("crack", "wide", "structure", "full", "majorCrack"),
  rule("tilt", "slight", "structure", "partial"),
  rule("tilt", "severe", "structure", "full", "severeTilt"),
  rule("bathroom", "usable", "bathroom", "good"),
  rule("bathroom", "partial", "bathroom", "partial"),
  rule("bathroom", "full", "bathroom", "full"),
  rule("kitchen", "usable", "kitchen", "good"),
  rule("kitchen", "partial", "kitchen", "partial"),
  rule("kitchen", "full", "kitchen", "full"),
  rule("heating", "briquette", "electrical", "partial"),
  rule("heating", "none", "electrical", "partial"),
];

// 체크리스트 답 + 판정표 → 공정별 상태·위험 신호.
// 답과 맞는 줄을 모두 적용하고, 한 공정에 여러 줄이 걸리면 가장 나쁜 판정을 쓴다.
export function evaluateChecklist(
  answers: ChecklistAnswers,
  rules: readonly ChecklistRule[] = DEFAULT_CHECKLIST_RULES,
): ChecklistResult {
  const conditions: Partial<Record<ProcessId, ConditionGrade>> = {};
  const riskFlags: RiskFlag[] = [];
  const answerOf = answers as Record<string, string>;

  for (const r of rules) {
    if (answerOf[r.question] !== r.answer) continue;
    if (r.process && r.grade) {
      conditions[r.process] = worse(conditions[r.process], r.grade);
    }
    if (r.risk && !riskFlags.some((f) => f.id === r.risk)) {
      riskFlags.push({ id: r.risk, reason: labelOf(r.question, r.answer) });
    }
  }

  return {
    conditions,
    riskFlags,
    unknownAnswers: countUnknown(answers),
  };
}

// 판정표에 한 줄도 없는 답 (관리자 화면에서 빠진 답을 보여줄 때 쓴다)
export function uncoveredAnswers(rules: readonly ChecklistRule[]) {
  const covered = new Set(rules.map((r) => `${r.question}:${r.answer}`));
  return CHECKLIST_QUESTIONS.flatMap((q) =>
    q.options
      .filter((o) => !covered.has(`${q.id}:${o.id}`))
      .map((o) => ({ question: q.id as string, answer: o.id as string })),
  );
}

const ORDER: ConditionGrade[] = ["good", "partial", "full"];

// 둘 중 더 나쁜 상태
export function worse(
  a: ConditionGrade | undefined,
  b: ConditionGrade,
): ConditionGrade {
  if (!a) return b;
  return ORDER.indexOf(a) >= ORDER.indexOf(b) ? a : b;
}

export function countUnknown(answers: ChecklistAnswers): number {
  return Object.values(answers).filter((v) => v === "unknown").length;
}
