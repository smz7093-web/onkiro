import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import type { ChecklistResult } from "../engine/checklist";
import type {
  EstimateResult,
  RevenueInput,
  RevenueResult,
  ScenarioId,
} from "../engine/types";
import { db } from "../firebase/client";
import {
  inputsKey,
  type EstimateOptions,
  type SnapshotInputs,
} from "./compute";
import type { Assessment, AssessmentStatus } from "./store";

// 계산 스냅샷 (SIM-20, task.md 7.4). assessments/{id}/snapshots/{id}에 추가만 하고 고치지 않는다.
// 생성 시점: ① 견적 화면에 처음 도달 ② 저장·PDF·상담 버튼. 입력이 마지막 스냅샷과 같으면 만들지 않는다.

export type SnapshotReason = "view" | "save" | "pdf" | "consult";

export interface SnapshotPayload {
  inputs: SnapshotInputs;
  options: EstimateOptions;
  estimate: EstimateResult;
  checklistResult: ChecklistResult;
  scenarios: Record<ScenarioId, RevenueResult>;
}

// Firestore는 undefined를 저장하지 못한다 (계산 결과의 빈 값은 null로)
const clean = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

function nextStatus(
  current: AssessmentStatus,
  expertRequired: boolean,
): AssessmentStatus {
  // 상담이 연결된 진단은 consult를 유지한다 (prd.md 6.7)
  if (current === "consult") return current;
  return expertRequired ? "expertRequired" : "saved";
}

// 입력이 바뀌었으면 스냅샷을 만들고 그 id를, 같으면 마지막 스냅샷 id를 돌려준다.
export async function ensureSnapshot(
  assessment: Assessment,
  payload: SnapshotPayload,
  reason: SnapshotReason,
): Promise<string> {
  const key = inputsKey(payload.inputs);
  if (assessment.latestSnapshotId && assessment.latestInputsKey === key) {
    return assessment.latestSnapshotId;
  }
  const aRef = doc(db, "assessments", assessment.id);
  const sRef = doc(collection(aRef, "snapshots"));
  const expertRequired = payload.checklistResult.riskFlags.length > 0;
  const batch = writeBatch(db);
  batch.set(sRef, {
    inputs: clean(payload.inputs),
    options: clean(payload.options),
    result: clean({
      estimate: payload.estimate,
      checklist: payload.checklistResult,
      scenarios: payload.scenarios,
    }),
    priceVersion: payload.inputs.priceVersion,
    assumptionVersion: payload.inputs.assumptionVersion,
    formulaVersion: payload.inputs.formulaVersion,
    inputsKey: key,
    reason,
    parentSnapshotId: null,
    createdBy: assessment.uid,
    createdAt: serverTimestamp(),
  });
  batch.update(aRef, {
    latestSnapshotId: sRef.id,
    latestInputsKey: key,
    latestSummary: {
      total: payload.estimate.total,
      rangeLow: payload.estimate.rangeLow,
      rangeHigh: payload.estimate.rangeHigh,
      baseNet: payload.scenarios.base.net,
    },
    estimateOptions: clean(payload.options),
    revenueInput: clean(payload.inputs.revenueInput),
    status: nextStatus(assessment.status, expertRequired),
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
  return sRef.id;
}

// 견적 화면의 옵션·수익 입력만 저장 (스냅샷 없이, 다음 방문 때 이어서 보이도록)
export async function saveResultInputs(
  assessment: Assessment,
  options: EstimateOptions,
  revenueInput: RevenueInput | null,
) {
  const batch = writeBatch(db);
  batch.update(doc(db, "assessments", assessment.id), {
    estimateOptions: clean(options),
    ...(revenueInput ? { revenueInput: clean(revenueInput) } : {}),
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}

export interface StoredSnapshot {
  id: string;
  inputs: SnapshotInputs;
  options: EstimateOptions;
  estimate: EstimateResult;
  checklistResult: ChecklistResult;
  scenarios: Record<ScenarioId, RevenueResult>;
  reason: SnapshotReason;
  createdAt: Date | null;
}

// 저장된 스냅샷 그대로 읽는다 (리포트 다시 보기는 재계산하지 않는다, COM-03)
export async function getSnapshot(
  assessmentId: string,
  snapshotId: string,
): Promise<StoredSnapshot | null> {
  const snap = await getDoc(
    doc(db, "assessments", assessmentId, "snapshots", snapshotId),
  );
  if (!snap.exists()) return null;
  const d = snap.data();
  const result = d.result as {
    estimate: EstimateResult;
    checklist: ChecklistResult;
    scenarios: Record<ScenarioId, RevenueResult>;
  };
  return {
    id: snap.id,
    inputs: d.inputs as SnapshotInputs,
    options: d.options as EstimateOptions,
    estimate: result.estimate,
    checklistResult: result.checklist,
    scenarios: result.scenarios,
    reason: d.reason as SnapshotReason,
    createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : null,
  };
}
