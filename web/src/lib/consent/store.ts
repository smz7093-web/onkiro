import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/client";
import { CONSENT_ITEMS, type ConsentType } from "./definitions";
import { evaluateConsents, type ConsentRecord } from "./evaluate";

const consentsOf = (uid: string) => collection(db, "users", uid, "consents");

export async function loadConsentRecords(
  uid: string,
): Promise<ConsentRecord[]> {
  const snap = await getDocs(consentsOf(uid));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      type: data.type as ConsentType,
      version: data.version as string,
      agreed: data.agreed === true,
      // 방금 쓴 기록은 서버 시각이 아직 없을 수 있다
      agreedAt:
        data.agreedAt instanceof Timestamp
          ? data.agreedAt.toDate()
          : new Date(),
    };
  });
}

export async function loadConsentStatus(uid: string) {
  return evaluateConsents(await loadConsentRecords(uid));
}

// 화면에서 고른 동의 여부를 항목마다 한 건씩 추가한다. 기존 기록은 고치지 않는다.
export async function saveConsents(
  uid: string,
  choices: Partial<Record<ConsentType, boolean>>,
) {
  const batch = writeBatch(db);
  for (const item of CONSENT_ITEMS) {
    const agreed = choices[item.type] === true;
    if (item.required && !agreed) {
      throw new Error(`필수 동의 항목이 빠졌습니다: ${item.label}`);
    }
    batch.set(doc(consentsOf(uid)), {
      type: item.type,
      version: item.version,
      agreed,
      agreedAt: serverTimestamp(),
    });
  }
  await batch.commit();
}

// 선택 동의 철회 (마이페이지에서 사용, task.md 8.2).
export async function withdrawOptionalConsent(uid: string, type: ConsentType) {
  const item = CONSENT_ITEMS.find((i) => i.type === type);
  if (!item || item.required)
    throw new Error("선택 동의 항목만 철회할 수 있습니다");
  const batch = writeBatch(db);
  batch.set(doc(consentsOf(uid)), {
    type,
    version: item.version,
    agreed: false,
    agreedAt: serverTimestamp(),
  });
  await batch.commit();
}
