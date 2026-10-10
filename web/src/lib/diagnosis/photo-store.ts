import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { loadConsentStatus } from "../consent/store";
import { db, storage } from "../firebase/client";
import { preparePhoto } from "./photo-file";
import type { PhotoPartId } from "./photos";

// 진단 사진 (SIM-06, task.md 6.4). 기록은 assessments/{id}/photos, 파일은 Storage 같은 경로.
// 보관 기간(deleteAfter)은 사진 정책(D8)이 확정되면 채운다.

export interface DiagnosisPhoto {
  id: string;
  part: PhotoPartId;
  storagePath: string;
  createdAt: Date | null;
}

const photosOf = (assessmentId: string) =>
  collection(db, "assessments", assessmentId, "photos");

export async function listPhotos(
  assessmentId: string,
): Promise<DiagnosisPhoto[]> {
  const snap = await getDocs(photosOf(assessmentId));
  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        part: data.part as PhotoPartId,
        storagePath: data.storagePath as string,
        createdAt:
          data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null,
      };
    })
    .sort(
      (a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0),
    );
}

export async function photoUrl(storagePath: string) {
  return getDownloadURL(ref(storage, storagePath));
}

// 줄이고 위치정보를 지운 뒤 올린다. 파일을 먼저 올리고 기록을 남긴다.
export async function uploadPhoto(
  uid: string,
  assessmentId: string,
  part: PhotoPartId,
  file: File,
): Promise<DiagnosisPhoto> {
  const prepared = await preparePhoto(file);
  const photoRef = doc(photosOf(assessmentId));
  const storagePath = `assessments/${assessmentId}/photos/${photoRef.id}.jpg`;
  await uploadBytes(ref(storage, storagePath), prepared.blob, {
    contentType: "image/jpeg",
  });
  // 사진 모델 개선용 선택 동의 (COM-04). 업로드 시점의 동의 여부를 남긴다
  const consent = await loadConsentStatus(uid);
  await setDoc(photoRef, {
    part,
    storagePath,
    exifStripped: true,
    consentModelUse: consent.optional.photoModel === true,
    deleteAfter: null,
    width: prepared.width,
    height: prepared.height,
    size: prepared.blob.size,
    createdAt: serverTimestamp(),
  });
  return { id: photoRef.id, part, storagePath, createdAt: new Date() };
}

export async function deletePhoto(assessmentId: string, photo: DiagnosisPhoto) {
  await deleteDoc(doc(photosOf(assessmentId), photo.id));
  await deleteObject(ref(storage, photo.storagePath)).catch(() => {
    // 기록은 지웠으니 파일 삭제 실패는 정리 작업(11.2)에서 처리한다
  });
}
