import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { setGlobalOptions } from "firebase-functions/v2";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import {
  claimsFromPermissions,
  permissionFieldsFromInput,
  permissionsFromDoc,
  sameClaims,
} from "./permissions.js";

initializeApp();

// 모든 함수는 서울 리전에서 실행한다 (prd.md 10절 데이터 위치).
setGlobalOptions({ region: "asia-northeast3", maxInstances: 10 });

// 배포·에뮬레이터 연결 확인용. 외부 API 프록시(Phase 4)가 생기면 지운다.
export const ping = onCall(() => ({ ok: true, at: new Date().toISOString() }));

// 회원 문서의 권한 필드를 Auth 커스텀 클레임으로 옮긴다 (task.md 2.3).
// 권한 필드는 관리자 함수(setUserPermissions)나 Firebase 콘솔에서만 바뀐다. 회원 본인은 보안 규칙상 쓸 수 없다.
// 첫 관리자는 콘솔에서 본인 문서의 role을 admin으로 바꾸면 이 함수가 반영한다.
export const syncUserClaims = onDocumentWritten("users/{uid}", async (event) => {
  const uid = event.params.uid;
  const after = event.data?.after;
  const auth = getAuth();

  let current: Record<string, unknown> | undefined;
  try {
    current = (await auth.getUser(uid)).customClaims;
  } catch (e) {
    // 콘솔에서 Auth 계정 없이 문서만 만든 경우
    logger.warn("syncUserClaims: Auth 사용자가 없습니다", { uid, error: String(e) });
    return;
  }

  if (!after?.exists) {
    if (current && Object.keys(current).length > 0) await auth.setCustomUserClaims(uid, null);
    return;
  }

  const next = claimsFromPermissions(permissionsFromDoc(after.data()));
  if (sameClaims(current, next)) return;
  await auth.setCustomUserClaims(uid, { ...next });
  logger.info("syncUserClaims: 권한 반영", { uid, role: next.role, perms: next.perms });
});

// 관리자만 다른 회원의 권한을 바꾼다 (ADM-05). 결과는 syncUserClaims가 토큰에 반영한다.
export const setUserPermissions = onCall(async (request) => {
  if (request.auth?.token.role !== "admin") {
    throw new HttpsError("permission-denied", "관리자만 권한을 바꿀 수 있습니다");
  }
  const { uid, ...rest } = (request.data ?? {}) as Record<string, unknown>;
  if (typeof uid !== "string" || uid.length === 0) {
    throw new HttpsError("invalid-argument", "uid가 필요합니다");
  }
  const parsed = permissionFieldsFromInput(rest);
  if (!parsed.ok) throw new HttpsError("invalid-argument", parsed.error);
  // 관리자가 스스로 관리자 권한을 내려 관리할 사람이 없어지는 일을 막는다
  if (uid === request.auth.uid && parsed.fields.role !== "admin") {
    throw new HttpsError("failed-precondition", "본인의 관리자 권한은 내릴 수 없습니다");
  }

  const db = getFirestore();
  const userRef = db.collection("users").doc(uid);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) {
      throw new HttpsError("not-found", "회원 문서가 없습니다. 먼저 한 번 로그인해야 합니다");
    }
    const before = Object.fromEntries(
      Object.keys(parsed.fields).map((k) => [k, snap.get(k) ?? null]),
    );
    tx.update(userRef, parsed.fields);
    tx.create(db.collection("auditLogs").doc(), {
      path: userRef.path,
      actorUid: request.auth!.uid,
      action: "setUserPermissions",
      before,
      after: parsed.fields,
      at: FieldValue.serverTimestamp(),
    });
  });
  return { ok: true };
});
