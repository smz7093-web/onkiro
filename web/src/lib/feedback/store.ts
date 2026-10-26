import type { User } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/client";

// 사용자 피드백 (10/26, Final-Project 실사용자 테스트). 누구나(로그인 없이도) 보내고, 운영팀이 읽고 처리 상태를 바꾼다.
// 개인정보(이름·연락처)는 받지 않는다(firestore.rules가 필드를 막는다).

export const TESTER_TYPES = ["owner", "returnee", "industry", "other"] as const;
export type TesterType = (typeof TESTER_TYPES)[number];

export const TESTER_LABELS: Record<TesterType, string> = {
  owner: "빈집 소유주·상속인",
  returnee: "귀촌·귀농 희망",
  industry: "숙박·부동산·건축 관계자",
  other: "기타",
};

export const FEEDBACK_STATUSES = ["new", "planned", "done", "wontfix"] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export const FEEDBACK_STATUS_LABELS: Record<FeedbackStatus, string> = {
  new: "새 의견",
  planned: "반영 예정",
  done: "반영 완료",
  wontfix: "보류",
};

export const FEEDBACK_LIMITS = { text: 1000, note: 500, page: 200 } as const;

export interface FeedbackInput {
  testerType: TesterType;
  // 전체 만족도 1~5
  rating: number;
  // 결과(공사비·수익)를 믿을 만했나 1~5, 모르면 null
  trust: number | null;
  good: string;
  improve: string;
  // 어느 화면에서 왔는지 (예: /diagnose)
  page: string | null;
}

export interface Feedback extends FeedbackInput {
  id: string;
  uid: string | null;
  status: FeedbackStatus;
  note: string | null;
  handledByName: string | null;
  createdAt: Date | null;
}

// 앱 안의 경로만 받는다 (?from=/diagnose)
export function safeFromPage(raw: string | null): string | null {
  if (!raw || !/^\/[A-Za-z0-9/_\-[\]]*$/.test(raw)) return null;
  return raw.slice(0, FEEDBACK_LIMITS.page);
}

export function validateFeedback(f: FeedbackInput): string[] {
  const errs: string[] = [];
  if (!(f.rating >= 1 && f.rating <= 5)) errs.push("만족도를 골라 주세요");
  if (!f.good.trim() && !f.improve.trim())
    errs.push("좋았던 점이나 고칠 점 중 하나는 적어 주세요");
  return errs;
}

export async function submitFeedback(f: FeedbackInput, user: User | null) {
  await addDoc(collection(db, "feedback"), {
    testerType: f.testerType,
    rating: f.rating,
    trust: f.trust,
    good: f.good.trim().slice(0, FEEDBACK_LIMITS.text),
    improve: f.improve.trim().slice(0, FEEDBACK_LIMITS.text),
    page: f.page,
    uid: user?.uid ?? null,
    status: "new",
    createdAt: serverTimestamp(),
  });
}

export async function listFeedback(): Promise<Feedback[]> {
  const snap = await getDocs(
    query(collection(db, "feedback"), orderBy("createdAt", "desc")),
  );
  return snap.docs.map((d) => {
    const x = d.data();
    return {
      id: d.id,
      testerType: x.testerType as TesterType,
      rating: x.rating as number,
      trust: (x.trust as number | null) ?? null,
      good: (x.good as string) ?? "",
      improve: (x.improve as string) ?? "",
      page: (x.page as string | null) ?? null,
      uid: (x.uid as string | null) ?? null,
      status: (x.status as FeedbackStatus) ?? "new",
      note: (x.note as string | null) ?? null,
      handledByName: (x.handledByName as string | null) ?? null,
      createdAt:
        x.createdAt instanceof Timestamp ? x.createdAt.toDate() : null,
    };
  });
}

// 처리 상태·반영 메모 (운영팀)
export async function updateFeedback(
  id: string,
  status: FeedbackStatus,
  note: string,
  user: User,
  userName: string | null,
) {
  await updateDoc(doc(db, "feedback", id), {
    status,
    note: note.trim().slice(0, FEEDBACK_LIMITS.note) || null,
    handledBy: user.uid,
    handledByName: userName,
    handledAt: serverTimestamp(),
  });
}

// 관리 화면 요약: 건수, 평균 만족도·신뢰도, 상태별 건수
export function summarize(list: Feedback[]) {
  const avg = (ns: number[]) =>
    ns.length ? Math.round((ns.reduce((a, b) => a + b, 0) / ns.length) * 10) / 10 : null;
  return {
    count: list.length,
    rating: avg(list.map((f) => f.rating)),
    trust: avg(list.flatMap((f) => (f.trust === null ? [] : [f.trust]))),
    byStatus: Object.fromEntries(
      FEEDBACK_STATUSES.map((s) => [s, list.filter((f) => f.status === s).length]),
    ) as Record<FeedbackStatus, number>,
    byTester: Object.fromEntries(
      TESTER_TYPES.map((t) => [t, list.filter((f) => f.testerType === t).length]),
    ) as Record<TesterType, number>,
  };
}
