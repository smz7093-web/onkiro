import {
  collection,
  getDocs,
  limit,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebase/client";

// 사진 삭제 요청 처리 (task.md 11.2). 서버 함수 assessmentPhotosAdmin, 처리 기록은 auditLogs.

export interface PhotoInfo {
  assessmentId: string;
  address: string | null;
  photos: number;
  retention: { kind: "expires"; at: string } | { kind: "consult" } | null;
  purgedAt: string | null;
  deleted: number;
}

const call = httpsCallable<
  { code: string; action: "inspect" | "delete"; reason?: string },
  PhotoInfo
>(functions, "assessmentPhotosAdmin");

export async function inspectPhotos(code: string) {
  return (await call({ code, action: "inspect" })).data;
}

export async function deletePhotosByRequest(code: string, reason: string) {
  return (await call({ code, action: "delete", reason })).data;
}

export interface PhotoLog {
  id: string;
  path: string;
  action: "deleteAssessmentPhotos" | "purgeExpiredPhotos";
  photos: number;
  reason: string | null;
  actorUid: string;
  at: Date | null;
}

// 최근 사진 삭제 기록 (관리자 요청 처리 + 자동 삭제). 색인 없이 쓰려고 정렬은 화면에서 한다
export async function listPhotoLogs(): Promise<PhotoLog[]> {
  const snap = await getDocs(
    query(
      collection(db, "auditLogs"),
      where("action", "in", ["deleteAssessmentPhotos", "purgeExpiredPhotos"]),
      limit(200),
    ),
  );
  return snap.docs
    .map((d) => {
      const x = d.data();
      return {
        id: d.id,
        path: String(x.path ?? ""),
        action: x.action,
        photos: Number(x.before?.photos ?? 0),
        reason: typeof x.reason === "string" ? x.reason : null,
        actorUid: String(x.actorUid ?? ""),
        at: x.at instanceof Timestamp ? x.at.toDate() : null,
      } as PhotoLog;
    })
    .sort((a, b) => (b.at?.getTime() ?? 0) - (a.at?.getTime() ?? 0))
    .slice(0, 30);
}
