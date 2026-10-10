import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/client";
import { SAMPLE_BRANCHES } from "./sample";
import type { Branch, BranchContent } from "./types";

// 숙소 상세 읽기 (STY-01). 누구나 읽을 수 있다 (firestore.rules branches).
// Firestore에 문서가 없으면 같은 id의 샘플을 돌려준다. 둘 다 없으면 null.
export async function getBranch(id: string): Promise<Branch | null> {
  const snap = await getDoc(doc(db, "branches", id));
  if (snap.exists()) {
    const d = snap.data();
    return {
      id: snap.id,
      name: (d.name as string) ?? "",
      content: d.content as BranchContent,
      airbnbUrl: (d.airbnbUrl as string) ?? null,
      naverUrl: (d.naverUrl as string) ?? null,
      sample: false,
    };
  }
  return SAMPLE_BRANCHES.find((b) => b.id === id) ?? null;
}
