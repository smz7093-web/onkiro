// 외부 조회 결과 캐시 (task.md 4.1): 같은 필지·검색어는 저장해 둔 결과를 다시 쓴다(호출 제한 대비).
// apiCache/{api}_{key}. 서버(관리자 SDK)만 읽고 쓴다 — 클라이언트는 규칙의 기본 거부에 걸린다.

import {
  FieldValue,
  Timestamp,
  type Firestore,
} from "firebase-admin/firestore";

const DAY = 24 * 60 * 60 * 1000;

export function cacheKey(api: string, key: string) {
  // 문서 id에 쓸 수 없는 문자는 바꾼다
  return `${api}_${key}`.replace(/[^A-Za-z0-9가-힣_-]/g, "_").slice(0, 500);
}

export async function readCache<T>(
  db: Firestore,
  api: string,
  key: string,
  maxAgeDays: number,
): Promise<{ value: T; fetchedAt: string } | null> {
  const snap = await db.collection("apiCache").doc(cacheKey(api, key)).get();
  if (!snap.exists) return null;
  const at = snap.get("fetchedAt") as Timestamp | undefined;
  if (!at || Date.now() - at.toMillis() > maxAgeDays * DAY) return null;
  return {
    value: snap.get("value") as T,
    fetchedAt: at.toDate().toISOString(),
  };
}

export async function writeCache(
  db: Firestore,
  api: string,
  key: string,
  value: unknown,
) {
  await db
    .collection("apiCache")
    .doc(cacheKey(api, key))
    .set({ api, key, value, fetchedAt: FieldValue.serverTimestamp() });
}
