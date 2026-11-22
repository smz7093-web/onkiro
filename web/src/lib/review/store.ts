import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import type {
  EstimateResult,
  RevenueResult,
  ScenarioId,
} from "../engine/types";
import { db, functions } from "../firebase/client";
import {
  getAssessment,
  reviewIsCurrent,
  toAssessment,
  type Assessment,
} from "../diagnosis/store";
import { getSnapshot, type StoredSnapshot } from "../diagnosis/snapshot-store";
import { getVersion } from "../versions/store";
import type { ReviewChange } from "./apply";

// 진단 검수 (ADM-03, task.md 11.4). 목록은 견적이 나온 진단 전부(11/22 PM 결정), 저장은 서버 함수 reviewDiagnosis.

export type ReviewState = "pending" | "stale" | "corrected" | "confirmed";

export function reviewState(a: Assessment): ReviewState {
  if (!a.review) return "pending";
  if (!reviewIsCurrent(a)) return "stale";
  return a.review.status;
}

export const REVIEW_STATE_LABEL: Record<ReviewState, string> = {
  pending: "검수 대기",
  stale: "검수 후 입력 바뀜",
  corrected: "보정 완료",
  confirmed: "확인 완료",
};

const needsReview = (a: Assessment) => {
  const s = reviewState(a);
  return s === "pending" || s === "stale";
};

// 검수할 것 먼저, 그 안에서 상담 연결·전문가 확인 필요를 위로, 최근 것 먼저
export function sortQueue(list: Assessment[]): Assessment[] {
  const rank = (a: Assessment) =>
    (needsReview(a) ? 0 : 10) +
    (a.status === "consult" ? 0 : a.status === "expertRequired" ? 1 : 2);
  return [...list].sort(
    (x, y) =>
      rank(x) - rank(y) ||
      (y.updatedAt?.getTime() ?? 0) - (x.updatedAt?.getTime() ?? 0),
  );
}

export async function listReviewQueue(): Promise<Assessment[]> {
  const snap = await getDocs(
    query(
      collection(db, "assessments"),
      where("latestSnapshotId", "!=", null),
      limit(500),
    ),
  );
  return sortQueue(snap.docs.map((d) => toAssessment(d.id, d.data())));
}

export function countPendingReviews(list: Assessment[]) {
  return list.filter(needsReview).length;
}

export interface ReviewContext {
  assessment: Assessment;
  snapshot: StoredSnapshot;
  // 검수 스냅샷이 있으면 (지난 보정 내용 보기)
  reviewed: StoredSnapshot | null;
}

export async function loadReviewContext(
  aid: string,
): Promise<ReviewContext | null> {
  const a = await getAssessment(aid);
  if (!a?.latestSnapshotId) return null;
  const [snapshot, reviewed] = await Promise.all([
    getSnapshot(aid, a.latestSnapshotId),
    a.review?.snapshotId
      ? getSnapshot(aid, a.review.snapshotId)
      : Promise.resolve(null),
  ]);
  if (!snapshot) return null;
  return { assessment: a, snapshot, reviewed };
}

// 스냅샷 당시 단가·가정값 버전 (같은 버전으로 다시 계산해야 원래 결과와 맞는다)
export async function loadVersionsOf(s: StoredSnapshot) {
  const [price, assumption] = await Promise.all([
    getVersion("price", s.inputs.priceVersion),
    getVersion("assumption", s.inputs.assumptionVersion),
  ]);
  if (!price || !assumption)
    throw new Error(
      `스냅샷의 단가(${s.inputs.priceVersion}) 또는 가정값(${s.inputs.assumptionVersion}) 버전을 찾을 수 없습니다`,
    );
  return { price: price.data, assumption: assumption.data };
}

type CallInput =
  | {
      action: "confirm";
      assessmentId: string;
      baseSnapshotId: string;
      note: string;
    }
  | {
      action: "correct";
      assessmentId: string;
      baseSnapshotId: string;
      note: string;
      conditions: Record<string, string>;
      estimate: EstimateResult;
      scenarios: Record<ScenarioId, RevenueResult>;
      changes: ReviewChange[];
    };

const call = httpsCallable<
  CallInput,
  { status: "corrected" | "confirmed"; snapshotId: string | null }
>(functions, "reviewDiagnosis");

// Firestore·함수는 undefined를 못 받는다
const clean = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

export async function submitReview(input: CallInput) {
  return (await call(clean(input))).data;
}
