// 진단 검수 (ADM-03, task.md 11.4). 담당자가 보정한 견적을 서버에서 검사한다.
// 계산은 화면(web/src/lib/review/apply.ts)이 하고, 서버는 권한·형식·합계가 맞는지 본다 (회원 스냅샷과 같은 방식).

export const PROCESS_IDS = [
  "demolition",
  "roof",
  "structure",
  "electrical",
  "insulation",
  "bathroom",
  "kitchen",
  "interior",
  "exterior",
  "iot",
] as const;
export const GRADES = ["good", "partial", "full"] as const;
const SCENARIOS = ["conservative", "base", "optimistic"] as const;
const MAX_WON = 100_000_000_000;

export function canReview(token: Record<string, unknown> | undefined) {
  if (!token) return false;
  if (token.role === "admin") return true;
  return (
    token.role === "staff" &&
    Array.isArray(token.perms) &&
    token.perms.includes("canReviewDiagnosis")
  );
}

export interface ReviewChange {
  process: string;
  fromGrade: string | null;
  toGrade: string | null;
  fromCost: number;
  toCost: number;
}

export interface ParsedReview {
  assessmentId: string;
  baseSnapshotId: string;
  action: "correct" | "confirm";
  note: string;
  // correct일 때만
  conditions?: Record<string, string>;
  estimate?: Record<string, unknown>;
  scenarios?: Record<string, unknown>;
  changes?: ReviewChange[];
}

const isWon = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= MAX_WON;
const near = (a: number, b: number) => Math.abs(a - b) <= 1;
const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const id = (v: unknown) =>
  typeof v === "string" && /^[A-Za-z0-9]{1,40}$/.test(v) ? v : null;

export class ReviewInputError extends Error {}

export function parseReview(data: unknown): ParsedReview {
  const d = isObj(data) ? data : {};
  const assessmentId = id(d.assessmentId);
  const baseSnapshotId = id(d.baseSnapshotId);
  if (!assessmentId || !baseSnapshotId)
    throw new ReviewInputError("진단과 기준 스냅샷을 알 수 없습니다");
  const action = d.action === "confirm" ? "confirm" : "correct";
  const note = typeof d.note === "string" ? d.note.trim() : "";
  if (note.length > 500)
    throw new ReviewInputError("사유는 500자 안으로 적어 주세요");
  if (action === "confirm")
    return { assessmentId, baseSnapshotId, action, note };

  if (note.length < 2)
    throw new ReviewInputError("보정 사유를 적어 주세요 (필수)");

  const conditions = isObj(d.conditions) ? d.conditions : null;
  if (
    !conditions ||
    !Object.entries(conditions).every(
      ([k, v]) =>
        (PROCESS_IDS as readonly string[]).includes(k) &&
        (GRADES as readonly string[]).includes(v as string),
    )
  )
    throw new ReviewInputError("공정 판정 값이 올바르지 않습니다");

  const est = isObj(d.estimate) ? d.estimate : null;
  const procs = est && Array.isArray(est.processes) ? est.processes : null;
  if (
    !est ||
    !procs ||
    procs.length > PROCESS_IDS.length ||
    !procs.every(
      (p) =>
        isObj(p) &&
        (PROCESS_IDS as readonly string[]).includes(p.id as string) &&
        (GRADES as readonly string[]).includes(p.grade as string) &&
        isWon(p.cost) &&
        isWon(p.days),
    ) ||
    new Set(procs.map((p) => (p as Record<string, unknown>).id)).size !==
      procs.length
  )
    throw new ReviewInputError("공정별 금액이 올바르지 않습니다");
  const { subtotal, contingency, total, rangeLow, rangeHigh } = est;
  if (
    !isWon(subtotal) ||
    !isWon(contingency) ||
    !isWon(total) ||
    !isWon(rangeLow) ||
    !isWon(rangeHigh) ||
    !near(
      subtotal,
      procs.reduce((s, p) => s + ((p as Record<string, number>).cost ?? 0), 0),
    ) ||
    !near(total, subtotal + contingency) ||
    rangeLow > total ||
    rangeHigh < total
  )
    throw new ReviewInputError("견적 합계가 맞지 않습니다");

  const scenarios = isObj(d.scenarios) ? d.scenarios : null;
  if (
    !scenarios ||
    !SCENARIOS.every(
      (s) =>
        isObj(scenarios[s]) &&
        typeof (scenarios[s] as Record<string, unknown>).net === "number",
    )
  )
    throw new ReviewInputError("수익 3안 결과가 없습니다");

  const changes = Array.isArray(d.changes) ? d.changes : [];
  if (
    changes.length === 0 ||
    changes.length > PROCESS_IDS.length ||
    !changes.every(
      (c) =>
        isObj(c) &&
        (PROCESS_IDS as readonly string[]).includes(c.process as string) &&
        isWon(c.fromCost) &&
        isWon(c.toCost),
    )
  )
    throw new ReviewInputError(
      "바뀐 공정이 없습니다. 그대로 두려면 '자동 견적 그대로 확인'을 누르세요",
    );
  return {
    assessmentId,
    baseSnapshotId,
    action,
    note,
    conditions: conditions as Record<string, string>,
    estimate: est,
    scenarios,
    changes: changes.map((c) => {
      const x = c as Record<string, unknown>;
      return {
        process: x.process as string,
        fromGrade: typeof x.fromGrade === "string" ? x.fromGrade : null,
        toGrade: typeof x.toGrade === "string" ? x.toGrade : null,
        fromCost: x.fromCost as number,
        toCost: x.toCost as number,
      };
    }),
  };
}
