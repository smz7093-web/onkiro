import type { User } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebase/client";

// AI 인허가 안내(RAG)가 찾아 쓰는 인허가 자료 (permitKnowledge, 10/26).
// 관리 화면 /admin/permit-knowledge에서 고친다. 운영팀이 읽고, 가정값·콘텐츠 편집 권한자가 쓴다(firestore.rules).
// 검색·AI 호출은 함수(functions/src/ai/permits.ts)가 한다. 아래 태그 목록은 그 파일의 KNOWLEDGE_TAGS와 같아야 한다.

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

// 태그가 어떤 집에 쓰이는지 (관리 화면 설명)
export const TAG_HINTS: Record<(typeof KNOWLEDGE_TAGS)[number], string> = {
  민박: "모든 집",
  거주: "모든 집",
  면적: "연면적 200㎡ 이상",
  위탁: "위탁 운영·미정",
  숙박업: "위탁 운영·미정",
  한옥: "목조 구조",
  용도: "주용도가 주택이 아님",
  용도지역: "용도지역 정보가 있음",
  도로: "맹지·좁은 길",
  무허가: "건축물대장 없음",
  석면: "슬레이트 지붕",
  소방: "모든 집",
  보험: "모든 집",
  물: "모든 집",
  오수: "모든 집",
  지원: "묻는 말로만",
};

export const KNOWLEDGE_LIMITS = {
  title: 80,
  source: 120,
  url: 300,
  body: 2000,
  tags: 10,
} as const;

export interface KnowledgeDoc {
  id: string;
  title: string;
  source: string;
  url: string | null;
  body: string;
  tags: string[];
  reviewed: boolean;
  updatedByName?: string | null;
  updatedAt?: Date | null;
}

export function validateKnowledge(d: KnowledgeDoc): string[] {
  const errs: string[] = [];
  if (!/^[A-Za-z0-9_-]{1,40}$/.test(d.id)) errs.push("번호 형식이 틀립니다");
  if (!d.title.trim()) errs.push("제목을 적어 주세요");
  if (!d.body.trim()) errs.push("본문을 적어 주세요");
  if (d.body.length > KNOWLEDGE_LIMITS.body)
    errs.push(`본문은 ${KNOWLEDGE_LIMITS.body}자까지입니다`);
  if (d.tags.length === 0) errs.push("주제 태그를 하나 이상 골라 주세요");
  if (d.url && !/^https?:\/\//.test(d.url))
    errs.push("링크는 http로 시작해야 합니다");
  return errs;
}

const COL = "permitKnowledge";

export async function listKnowledge(): Promise<KnowledgeDoc[]> {
  const snap = await getDocs(collection(db, COL));
  return snap.docs
    .map((d) => {
      const x = d.data();
      return {
        id: d.id,
        title: (x.title as string) ?? "",
        source: (x.source as string) ?? "",
        url: (x.url as string | null) ?? null,
        body: (x.body as string) ?? "",
        tags: Array.isArray(x.tags) ? (x.tags as string[]) : [],
        reviewed: x.reviewed === true,
        updatedByName: (x.updatedByName as string | null) ?? null,
        updatedAt:
          x.updatedAt instanceof Timestamp ? x.updatedAt.toDate() : null,
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

const fields = (d: KnowledgeDoc, user: User, userName: string | null) => ({
  title: d.title.trim(),
  source: d.source.trim(),
  url: d.url?.trim() || null,
  body: d.body.trim(),
  tags: d.tags,
  reviewed: d.reviewed,
  updatedBy: user.uid,
  updatedByName: userName,
  updatedAt: serverTimestamp(),
});

export async function saveKnowledge(
  d: KnowledgeDoc,
  user: User,
  userName: string | null,
) {
  await setDoc(doc(db, COL, d.id), fields(d, user, userName));
}

export async function deleteKnowledge(id: string) {
  await deleteDoc(doc(db, COL, id));
}

// 기본 자료(함수에 들어 있는 초안)를 받아 한 번에 저장한다. 저장된 자료가 없을 때만 쓴다
export async function importDefaultKnowledge(
  user: User,
  userName: string | null,
) {
  const { docs } = (
    await httpsCallable<void, { docs: KnowledgeDoc[] }>(
      functions,
      "permitKnowledgeDefaults",
    )()
  ).data;
  const batch = writeBatch(db);
  for (const d of docs)
    batch.set(doc(db, COL, d.id), fields(d, user, userName));
  await batch.commit();
  return docs.length;
}
