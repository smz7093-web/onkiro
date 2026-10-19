import { httpsCallable } from "firebase/functions";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import type { ChecklistAnswers } from "../engine/checklist";
import type { RevenueInput } from "../engine/types";
import { db, functions } from "../firebase/client";
import type { EstimateOptions } from "./compute";
import { initialFacts, type Facts } from "./facts";
import type { Nearby } from "./lookup";
import { deletePhoto, listPhotos } from "./photo-store";
import { advanceReached, type StepId } from "./steps";

// 진단(assessments)과 빈집(properties) 문서 (prd.md 8절, task.md 6.1~6.5).
// 회원 본인만 읽고 쓴다 (firestore.rules). 단계마다 저장해 다른 기기에서도 이어서 진행한다.

export type AssessmentStatus = "draft" | "saved" | "consult" | "expertRequired";

export interface Assessment {
  id: string;
  uid: string;
  propertyId: string | null;
  address: string | null;
  status: AssessmentStatus;
  // 지금까지 도달한 단계 (이 단계까지 열 수 있다)
  reached: StepId;
  checklist: Partial<ChecklistAnswers>;
  // 결과 화면 값 (task.md 7.1~7.4). 스냅샷을 만들 때 함께 갱신한다
  estimateOptions: EstimateOptions | null;
  revenueInput: RevenueInput | null;
  latestSnapshotId: string | null;
  // 마지막 스냅샷 입력의 지문 (같으면 새 스냅샷을 만들지 않는다)
  latestInputsKey: string | null;
  // 마이페이지 목록용 요약 (원 단위, 반올림 전)
  latestSummary: LatestSummary | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface LatestSummary {
  total: number;
  rangeLow: number;
  rangeHigh: number;
  baseNet: number;
}

export interface AddressInput {
  addressRoad: string;
  addressJibun: string | null;
  // 주소 검색(4.2)으로 찾으면 채운다. 직접 입력이면 null
  pnu: string | null;
  lat: number | null;
  lng: number | null;
}

export interface Property extends AddressInput {
  id: string;
  ownerUid: string;
  noRegistry: boolean;
  facts: Facts;
  // 주변 관광지 (SIM-04 시연판, task.md 4.5)
  nearby: Nearby | null;
  // 외부 조회를 마친 주소 (같은 주소로는 다시 조회하지 않는다)
  lookedUpFor: string | null;
}

const toDate = (v: unknown) => (v instanceof Timestamp ? v.toDate() : null);

function toAssessment(id: string, d: Record<string, unknown>): Assessment {
  return {
    id,
    uid: d.uid as string,
    propertyId: (d.propertyId as string) ?? null,
    address: (d.address as string) ?? null,
    status: (d.status as AssessmentStatus) ?? "draft",
    reached: (d.reached as StepId) ?? "address",
    checklist: (d.checklist as Partial<ChecklistAnswers>) ?? {},
    estimateOptions: (d.estimateOptions as EstimateOptions) ?? null,
    revenueInput: (d.revenueInput as RevenueInput) ?? null,
    latestSnapshotId: (d.latestSnapshotId as string) ?? null,
    latestInputsKey: (d.latestInputsKey as string) ?? null,
    latestSummary: (d.latestSummary as LatestSummary) ?? null,
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
  };
}

export async function createAssessment(uid: string): Promise<string> {
  const ref = doc(collection(db, "assessments"));
  const batch = writeBatch(db);
  batch.set(ref, {
    uid,
    propertyId: null,
    address: null,
    status: "draft",
    reached: "address",
    checklist: {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
  return ref.id;
}

// 내 진단 목록. 최근 수정 순 (색인 없이 쓰려고 정렬은 화면에서 한다)
export async function listMyAssessments(uid: string): Promise<Assessment[]> {
  const snap = await getDocs(
    query(collection(db, "assessments"), where("uid", "==", uid)),
  );
  return snap.docs
    .map((d) => toAssessment(d.id, d.data()))
    .sort(
      (a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0),
    );
}

export async function loadDiagnosis(
  id: string,
): Promise<{ assessment: Assessment; property: Property | null } | null> {
  const snap = await getDoc(doc(db, "assessments", id));
  if (!snap.exists()) return null;
  const assessment = toAssessment(snap.id, snap.data());
  if (!assessment.propertyId) return { assessment, property: null };
  const p = await getDoc(doc(db, "properties", assessment.propertyId));
  if (!p.exists()) return { assessment, property: null };
  const d = p.data();
  return {
    assessment,
    property: {
      id: p.id,
      ownerUid: d.ownerUid as string,
      addressRoad: d.addressRoad as string,
      addressJibun: (d.addressJibun as string) ?? null,
      pnu: (d.pnu as string) ?? null,
      lat: (d.lat as number) ?? null,
      lng: (d.lng as number) ?? null,
      noRegistry: d.noRegistry === true,
      facts: (d.facts as Facts) ?? {},
      nearby: (d.nearby as Nearby) ?? null,
      lookedUpFor: (d.lookedUpFor as string) ?? null,
    },
  };
}

// 주소 단계 저장. 처음이면 빈집 문서를 만들고, 다시 고치면 주소만 바꾼다.
export async function saveAddress(
  assessment: Assessment,
  input: AddressInput,
): Promise<void> {
  const batch = writeBatch(db);
  const aRef = doc(db, "assessments", assessment.id);
  const now = serverTimestamp();
  let propertyId = assessment.propertyId;
  if (propertyId) {
    batch.update(doc(db, "properties", propertyId), {
      ...input,
      updatedAt: now,
    });
  } else {
    const pRef = doc(collection(db, "properties"));
    propertyId = pRef.id;
    batch.set(pRef, {
      ...input,
      ownerUid: assessment.uid,
      noRegistry: false,
      facts: initialFacts(),
      createdAt: now,
      updatedAt: now,
    });
  }
  batch.update(aRef, {
    propertyId,
    address: input.addressRoad,
    reached: advanceReached(assessment.reached, "address"),
    updatedAt: now,
  });
  await batch.commit();
}

// 기본 정보 단계 저장 (6.3)
export async function saveFacts(
  assessment: Assessment,
  propertyId: string,
  facts: Facts,
  noRegistry: boolean,
  lookup?: { nearby: Nearby | null; lookedUpFor: string },
): Promise<void> {
  const batch = writeBatch(db);
  const now = serverTimestamp();
  batch.update(doc(db, "properties", propertyId), {
    facts,
    noRegistry,
    ...(lookup
      ? { nearby: lookup.nearby, lookedUpFor: lookup.lookedUpFor }
      : {}),
    updatedAt: now,
  });
  batch.update(doc(db, "assessments", assessment.id), {
    reached: advanceReached(assessment.reached, "confirm"),
    updatedAt: now,
  });
  await batch.commit();
}

// 체크리스트 답 하나를 고를 때마다 저장한다 (6.5)
export async function saveChecklist(
  assessmentId: string,
  checklist: Partial<ChecklistAnswers>,
): Promise<void> {
  await updateDoc(doc(db, "assessments", assessmentId), {
    checklist,
    updatedAt: serverTimestamp(),
  });
}

// 체크리스트 완료: 답과 도달 단계를 한 번에 저장한다 (7.6 응답 속도, 쓰기 2번 → 1번)
export async function finishChecklist(
  assessment: Assessment,
  checklist: Partial<ChecklistAnswers>,
): Promise<void> {
  await updateDoc(doc(db, "assessments", assessment.id), {
    checklist,
    reached: advanceReached(assessment.reached, "checklist"),
    updatedAt: serverTimestamp(),
  });
}

// 내용 저장 없이 단계만 마칠 때 (사진 단계)
export async function finishStep(
  assessment: Assessment,
  step: StepId,
): Promise<StepId> {
  const reached = advanceReached(assessment.reached, step);
  if (reached !== assessment.reached) {
    await updateDoc(doc(db, "assessments", assessment.id), {
      reached,
      updatedAt: serverTimestamp(),
    });
  }
  return reached;
}

// 완료 전(draft) 진단만 회원이 지울 수 있다 (firestore.rules). 견적이 나온 진단은 개인정보 삭제 요청으로
export function canDeleteAssessment(a: Assessment) {
  return a.status === "draft" && !a.latestSnapshotId;
}

// 진단 삭제: 사진(파일·기록) → 진단·빈집 문서 순서로 지운다.
// 사진 기록 삭제 규칙이 진단 문서로 주인을 확인하므로 진단 문서는 마지막에 지운다.
export async function deleteAssessment(a: Assessment): Promise<void> {
  if (!canDeleteAssessment(a))
    throw new Error("견적이 나온 진단은 삭제할 수 없습니다");
  const photos = await listPhotos(a.id);
  for (const p of photos) await deletePhoto(a.id, p);
  const batch = writeBatch(db);
  batch.delete(doc(db, "assessments", a.id));
  if (a.propertyId) batch.delete(doc(db, "properties", a.propertyId));
  await batch.commit();
}

// 진단 문서만 읽는다 (리포트·상담 화면. 운영팀은 빈집 문서를 읽지 못한다)
export async function getAssessment(id: string): Promise<Assessment | null> {
  const snap = await getDoc(doc(db, "assessments", id));
  return snap.exists() ? toAssessment(snap.id, snap.data()) : null;
}

// 화면·리포트에 보이는 진단 번호 (예: DX-3F2A9C1E)
export function diagnosisCode(id: string) {
  return `DX-${id.slice(0, 8).toUpperCase()}`;
}

// 관리자 삭제: 견적이 나온 진단도 지운다(서버 함수 deleteAssessmentAdmin, 처리 기록 auditLogs). 되돌릴 수 없다
export async function deleteAssessmentAsAdmin(
  assessmentId: string,
  deleteConsults: boolean,
): Promise<{ deletedConsults: number }> {
  const res = await httpsCallable<
    { assessmentId: string; deleteConsults: boolean },
    { ok: boolean; deletedConsults: number }
  >(functions, "deleteAssessmentAdmin", { timeout: 120_000 })({
    assessmentId,
    deleteConsults,
  });
  return { deletedConsults: res.data.deletedConsults };
}
