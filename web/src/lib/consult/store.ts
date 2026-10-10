import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import type { Permissions } from "../permissions";
import { db, functions } from "../firebase/client";
import type { Assessment } from "../diagnosis/store";
import type { ConsultStage, ConsultType } from "./status";

// 상담 (CON-01·02, task.md 9.1·9.2). 회원은 신청만 하고, 변경은 서버 함수가 한다.

export const OWNERSHIPS = ["self", "family", "coHeir", "other"] as const;
export type Ownership = (typeof OWNERSHIPS)[number];

export const OWNERSHIP_LABELS: Record<Ownership, string> = {
  self: "본인 소유",
  family: "가족 소유",
  coHeir: "공동상속",
  other: "기타",
};

export interface Consultation {
  id: string;
  uid: string | null;
  type: ConsultType;
  assessmentId: string | null;
  snapshotId: string | null;
  applicantName: string;
  phone: string;
  ownership: Ownership;
  preferredDate: string | null;
  // 신청인이 쓴 메모
  memo: string;
  // 운영팀 메모 (관리 화면에서만)
  staffMemo: string;
  phoneRequested: boolean;
  status: ConsultStage;
  assigneeUid: string | null;
  assigneeName: string | null;
  proxyEnteredBy: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface ConsultEvent {
  id: string;
  kind: "status" | "assignee" | "memo";
  before: string | null;
  after: string | null;
  actorUid: string;
  at: Date | null;
}

export interface ApplyInput {
  type: ConsultType;
  applicantName: string;
  phone: string;
  ownership: Ownership;
  preferredDate: string | null;
  memo: string;
  phoneRequested: boolean;
}

const toDate = (v: unknown) => (v instanceof Timestamp ? v.toDate() : null);

function toConsultation(id: string, d: Record<string, unknown>): Consultation {
  return {
    id,
    uid: (d.uid as string) ?? null,
    type: d.type as ConsultType,
    assessmentId: (d.assessmentId as string) ?? null,
    snapshotId: (d.snapshotId as string) ?? null,
    applicantName: (d.applicantName as string) ?? "",
    phone: (d.phone as string) ?? "",
    ownership: (d.ownership as Ownership) ?? "other",
    preferredDate: (d.preferredDate as string) ?? null,
    memo: (d.memo as string) ?? "",
    staffMemo: (d.staffMemo as string) ?? "",
    phoneRequested: d.phoneRequested === true,
    status: (d.status as ConsultStage) ?? "received",
    assigneeUid: (d.assigneeUid as string) ?? null,
    assigneeName: (d.assigneeName as string) ?? null,
    proxyEnteredBy: (d.proxyEnteredBy as string) ?? null,
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
  };
}

const newestFirst = (a: Consultation, b: Consultation) =>
  (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0);

// 상담 신청 (9.1). 연결 진단은 consult로 바꾼다(위험 신호로 expertRequired면 유지, prd.md 6.7).
export async function applyConsultation(
  uid: string,
  input: ApplyInput,
  assessment: Assessment | null,
  snapshotId: string | null,
): Promise<string> {
  const ref = doc(collection(db, "consultations"));
  const batch = writeBatch(db);
  const now = serverTimestamp();
  batch.set(ref, {
    ...input,
    uid,
    assessmentId: assessment?.id ?? null,
    snapshotId: assessment ? snapshotId : null,
    status: "received",
    assigneeUid: null,
    assigneeName: null,
    proxyEnteredBy: null,
    createdAt: now,
    updatedAt: now,
  });
  if (assessment) {
    batch.update(doc(db, "assessments", assessment.id), {
      ...(assessment.status === "expertRequired" ? {} : { status: "consult" }),
      lastConsultId: ref.id,
      updatedAt: now,
    });
  }
  await batch.commit();
  return ref.id;
}

export async function listMyConsultations(
  uid: string,
): Promise<Consultation[]> {
  const snap = await getDocs(
    query(collection(db, "consultations"), where("uid", "==", uid)),
  );
  return snap.docs.map((d) => toConsultation(d.id, d.data())).sort(newestFirst);
}

// 관리 화면 목록. 담당 건 권한은 본인에게 배정된 상담만 읽을 수 있어 질의도 그렇게 건다.
export async function listConsultationsFor(
  uid: string,
  p: Permissions,
): Promise<Consultation[]> {
  const col = collection(db, "consultations");
  const q =
    p.role === "admin" || p.consultAccess === "all"
      ? query(col, orderBy("createdAt", "desc"))
      : query(col, where("assigneeUid", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => toConsultation(d.id, d.data())).sort(newestFirst);
}

// 접수 알림 배지용 (전체 상담 권한만)
export async function countReceived(): Promise<number> {
  const snap = await getDocs(
    query(collection(db, "consultations"), where("status", "==", "received")),
  );
  return snap.size;
}

export async function listEvents(consultId: string): Promise<ConsultEvent[]> {
  const snap = await getDocs(
    collection(db, "consultations", consultId, "events"),
  );
  return snap.docs
    .map((d) => {
      const x = d.data();
      return {
        id: d.id,
        kind: x.kind,
        before: x.before ?? null,
        after: x.after ?? null,
        actorUid: x.actorUid,
        at: toDate(x.at),
      } as ConsultEvent;
    })
    .sort((a, b) => (b.at?.getTime() ?? 0) - (a.at?.getTime() ?? 0));
}

export interface StaffMember {
  uid: string;
  name: string;
}

// 담당자 후보 (운영팀·관리자)
export async function listStaff(): Promise<StaffMember[]> {
  const snap = await getDocs(
    query(collection(db, "users"), where("role", "in", ["staff", "admin"])),
  );
  return snap.docs.map((d) => ({
    uid: d.id,
    name: (d.data().name as string) ?? "(이름 없음)",
  }));
}

export async function getConsultation(
  id: string,
): Promise<Consultation | null> {
  const snap = await getDoc(doc(db, "consultations", id));
  return snap.exists() ? toConsultation(snap.id, snap.data()) : null;
}

export async function updateConsultation(
  id: string,
  change: { status?: ConsultStage; assigneeUid?: string | null; memo?: string },
) {
  await httpsCallable(functions, "updateConsultation")({ id, ...change });
}

export async function createProxyConsultation(
  input: Omit<ApplyInput, "phoneRequested">,
) {
  const res = await httpsCallable<typeof input, { ok: boolean; id: string }>(
    functions,
    "createProxyConsultation",
  )(input);
  return res.data.id;
}
