import type { User } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import type { AssumptionSet, PriceTable } from "../engine/types";
import { db, functions } from "../firebase/client";

// 단가 DB·가정값 버전 (ADM-01·02). 규칙: firestore.rules, 적용: functions activateVersion.

export type VersionKind = "price" | "assumption";
export type VersionStatus = "draft" | "active" | "retired";
export type VersionData<K extends VersionKind> = K extends "price"
  ? PriceTable
  : AssumptionSet;

export interface VersionDoc<K extends VersionKind = VersionKind> {
  id: string;
  status: VersionStatus;
  data: VersionData<K>;
  note: string;
  basedOn: string | null;
  createdByName: string | null;
  createdAt: Date | null;
  updatedByName: string | null;
  updatedAt: Date | null;
  approvedByName: string | null;
  effectiveFrom: Date | null;
}

const COLLECTION: Record<VersionKind, string> = {
  price: "priceVersions",
  assumption: "assumptionVersions",
};

const toDate = (v: unknown) => (v instanceof Timestamp ? v.toDate() : null);

function fromSnap<K extends VersionKind>(
  id: string,
  d: Record<string, unknown>,
): VersionDoc<K> {
  return {
    id,
    status: d.status as VersionStatus,
    data: d.data as VersionData<K>,
    note: (d.note as string) ?? "",
    basedOn: (d.basedOn as string) ?? null,
    createdByName: (d.createdByName as string) ?? null,
    createdAt: toDate(d.createdAt),
    updatedByName: (d.updatedByName as string) ?? null,
    updatedAt: toDate(d.updatedAt),
    approvedByName: (d.approvedByName as string) ?? null,
    effectiveFrom: toDate(d.effectiveFrom),
  };
}

export async function listVersions<K extends VersionKind>(kind: K) {
  const snap = await getDocs(
    query(collection(db, COLLECTION[kind]), orderBy("createdAt", "desc")),
  );
  return snap.docs.map((d) => fromSnap<K>(d.id, d.data()));
}

export async function getVersion<K extends VersionKind>(kind: K, id: string) {
  const snap = await getDoc(doc(db, COLLECTION[kind], id));
  return snap.exists() ? fromSnap<K>(snap.id, snap.data()) : null;
}

// 시뮬레이터 계산용 적용 버전 (회원도 읽을 수 있다)
export async function loadActiveVersion<K extends VersionKind>(kind: K) {
  const snap = await getDocs(
    query(
      collection(db, COLLECTION[kind]),
      where("status", "==", "active"),
      limit(1),
    ),
  );
  const d = snap.docs[0];
  return d ? fromSnap<K>(d.id, d.data()) : null;
}

export async function createDraft<K extends VersionKind>(
  kind: K,
  version: string,
  data: VersionData<K>,
  basedOn: string | null,
  user: User,
  userName: string | null,
) {
  const ref = doc(db, COLLECTION[kind], version);
  if ((await getDoc(ref).catch(() => null))?.exists()) {
    throw new Error(`이미 있는 버전 이름입니다: ${version}`);
  }
  await setDoc(ref, {
    status: "draft",
    data: withoutUndefined({ ...data, version }),
    note: "",
    basedOn,
    createdBy: user.uid,
    createdByName: userName,
    createdAt: serverTimestamp(),
    updatedBy: user.uid,
    updatedByName: userName,
    updatedAt: serverTimestamp(),
  });
}

// 편집 화면은 비운 칸을 undefined로 둔다. Firestore는 undefined를 저장하지 못하므로(10/19 오류)
// 저장 직전에 그런 칸을 뺀다. 배열 안의 undefined는 null 대신 항목째 뺀다
export function withoutUndefined<T>(value: T): T {
  if (Array.isArray(value))
    return value
      .filter((v) => v !== undefined)
      .map((v) => withoutUndefined(v)) as T;
  if (value && typeof value === "object" && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, withoutUndefined(v)]),
    ) as T;
  }
  return value;
}

export async function saveDraft<K extends VersionKind>(
  kind: K,
  version: string,
  data: VersionData<K>,
  note: string,
  user: User,
  userName: string | null,
) {
  await updateDoc(doc(db, COLLECTION[kind], version), {
    data: withoutUndefined({ ...data, version }),
    note,
    updatedBy: user.uid,
    updatedByName: userName,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDraft(kind: VersionKind, version: string) {
  await deleteDoc(doc(db, COLLECTION[kind], version));
}

export async function activateVersion(kind: VersionKind, version: string) {
  const call = httpsCallable<
    { kind: VersionKind; version: string },
    { retired: string[] }
  >(functions, "activateVersion");
  return (await call({ kind, version })).data;
}

// 새 버전 이름 제안: 단가 v2026.10-2, 가정값 v0.4
export function suggestNextVersion(
  kind: VersionKind,
  existing: string[],
  today = new Date(),
) {
  if (kind === "price") {
    const prefix = `v${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}-`;
    const used = existing
      .filter((v) => v.startsWith(prefix))
      .map((v) => Number(v.slice(prefix.length)))
      .filter(Number.isInteger);
    return `${prefix}${used.length ? Math.max(...used) + 1 : 1}`;
  }
  const minors = existing
    .map((v) => /^v0\.(\d+)$/.exec(v)?.[1])
    .filter((m): m is string => m !== undefined)
    .map(Number);
  return `v0.${minors.length ? Math.max(...minors) + 1 : 1}`;
}
