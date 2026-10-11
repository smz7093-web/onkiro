import type { User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "../firebase/client";
import { preparePhoto } from "../diagnosis/photo-file";
import { SAMPLE_BRANCHES } from "./sample";
import type { Branch, BranchContent } from "./types";
import type { BranchDraft } from "./validate";

// 숙소 (STY-01·02, task.md 9.3). 누구나 읽고, 콘텐츠 편집 권한자(canEditContent)만 쓴다 (firestore.rules branches).

function toBranch(id: string, d: Record<string, unknown>): Branch {
  return {
    id,
    name: (d.name as string) ?? "",
    content: d.content as BranchContent,
    airbnbUrl: (d.airbnbUrl as string) ?? null,
    naverUrl: (d.naverUrl as string) ?? null,
    sample: false,
  };
}

// 숙소 상세 읽기. Firestore에 문서가 없으면 같은 id의 샘플을 돌려준다. 둘 다 없으면 null.
export async function getBranch(id: string): Promise<Branch | null> {
  const snap = await getDoc(doc(db, "branches", id));
  if (snap.exists()) return toBranch(snap.id, snap.data());
  return SAMPLE_BRANCHES.find((b) => b.id === id) ?? null;
}

export interface BranchSummary extends Branch {
  updatedByName: string | null;
  updatedAt: Date | null;
}

export async function listBranches(): Promise<BranchSummary[]> {
  const snap = await getDocs(collection(db, "branches"));
  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        ...toBranch(d.id, data),
        updatedByName: (data.updatedByName as string) ?? null,
        updatedAt:
          data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : null,
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

// 저장 (없으면 만든다). 저장 전에 normalizeBranch·validateBranch를 거친다.
export async function saveBranch(
  id: string,
  draft: BranchDraft,
  user: User,
  userName: string | null,
) {
  await setDoc(doc(db, "branches", id), {
    ...draft,
    updatedBy: user.uid,
    updatedByName: userName,
    updatedAt: serverTimestamp(),
  });
}

// 숙소 사진: 줄이고 메타데이터를 지운 뒤 공개 경로에 올린다 (storage.rules branches)
export async function uploadBranchPhoto(
  branchId: string,
  file: File,
): Promise<string> {
  const prepared = await preparePhoto(file);
  const name = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}.jpg`;
  const r = ref(storage, `branches/${branchId}/photos/${name}`);
  await uploadBytes(r, prepared.blob, { contentType: "image/jpeg" });
  return getDownloadURL(r);
}
