import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { setGlobalOptions } from "firebase-functions/v2";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions";
import {
  claimsFromPermissions,
  permissionFieldsFromInput,
  permissionsFromDoc,
  sameClaims,
} from "./permissions.js";
import {
  canHandle,
  canManageAll,
  parseProxyInput,
  planUpdate,
} from "./consult.js";
import { readCache, writeCache } from "./external/cache.js";
import { DEMO_FIXTURES } from "./external/demo-fixtures.js";
import { fetchJson } from "./external/http.js";
import {
  lookupProperty as lookupPropertyService,
  searchAddress as searchAddressService,
  type Deps,
} from "./external/lookup.js";
import {
  canApprove,
  COLLECTION_OF,
  VERSION_KINDS,
  validateVersion,
  type VersionKind,
} from "./versions.js";

initializeApp();

// 모든 함수는 서울 리전에서 실행한다 (prd.md 10절 데이터 위치).
setGlobalOptions({ region: "asia-northeast3", maxInstances: 10 });

// 배포·에뮬레이터 연결 확인용. 외부 API 프록시(Phase 4)가 생기면 지운다.
export const ping = onCall(() => ({ ok: true, at: new Date().toISOString() }));

// 회원 문서의 권한 필드를 Auth 커스텀 클레임으로 옮긴다 (task.md 2.3).
// 권한 필드는 관리자 함수(setUserPermissions)나 Firebase 콘솔에서만 바뀐다. 회원 본인은 보안 규칙상 쓸 수 없다.
// 첫 관리자는 콘솔에서 본인 문서의 role을 admin으로 바꾸면 이 함수가 반영한다.
export const syncUserClaims = onDocumentWritten(
  "users/{uid}",
  async (event) => {
    const uid = event.params.uid;
    const after = event.data?.after;
    const auth = getAuth();

    let current: Record<string, unknown> | undefined;
    try {
      current = (await auth.getUser(uid)).customClaims;
    } catch (e) {
      // 콘솔에서 Auth 계정 없이 문서만 만든 경우
      logger.warn("syncUserClaims: Auth 사용자가 없습니다", {
        uid,
        error: String(e),
      });
      return;
    }

    if (!after?.exists) {
      if (current && Object.keys(current).length > 0)
        await auth.setCustomUserClaims(uid, null);
      return;
    }

    const next = claimsFromPermissions(permissionsFromDoc(after.data()));
    if (sameClaims(current, next)) return;
    await auth.setCustomUserClaims(uid, { ...next });
    logger.info("syncUserClaims: 권한 반영", {
      uid,
      role: next.role,
      perms: next.perms,
    });
  },
);

// 관리자만 다른 회원의 권한을 바꾼다 (ADM-05). 결과는 syncUserClaims가 토큰에 반영한다.
export const setUserPermissions = onCall(async (request) => {
  if (request.auth?.token.role !== "admin") {
    throw new HttpsError(
      "permission-denied",
      "관리자만 권한을 바꿀 수 있습니다",
    );
  }
  const { uid, ...rest } = (request.data ?? {}) as Record<string, unknown>;
  if (typeof uid !== "string" || uid.length === 0) {
    throw new HttpsError("invalid-argument", "uid가 필요합니다");
  }
  const parsed = permissionFieldsFromInput(rest);
  if (!parsed.ok) throw new HttpsError("invalid-argument", parsed.error);
  // 관리자가 스스로 관리자 권한을 내려 관리할 사람이 없어지는 일을 막는다
  if (uid === request.auth.uid && parsed.fields.role !== "admin") {
    throw new HttpsError(
      "failed-precondition",
      "본인의 관리자 권한은 내릴 수 없습니다",
    );
  }

  const db = getFirestore();
  const userRef = db.collection("users").doc(uid);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) {
      throw new HttpsError(
        "not-found",
        "회원 문서가 없습니다. 먼저 한 번 로그인해야 합니다",
      );
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

// 단가 DB·가정값 초안을 적용한다 (ADM-01·02, task.md 5.1~5.3).
// 초안을 검증한 뒤, 기존 적용 버전을 retired로 바꾸고 이 버전을 active로 만든다. 적용 버전은 하나뿐이다.
// 클라이언트는 보안 규칙상 status를 바꿀 수 없고 이 함수만 바꾼다.
export const activateVersion = onCall(async (request) => {
  const token = request.auth?.token as Record<string, unknown> | undefined;
  if (!request.auth || !canApprove(token)) {
    throw new HttpsError(
      "permission-denied",
      "적용 권한(canApproveVersions)이 없습니다",
    );
  }
  const { kind, version } = (request.data ?? {}) as Record<string, unknown>;
  if (!VERSION_KINDS.includes(kind as VersionKind)) {
    throw new HttpsError(
      "invalid-argument",
      "kind는 price 또는 assumption이어야 합니다",
    );
  }
  if (typeof version !== "string" || version.length === 0) {
    throw new HttpsError("invalid-argument", "version이 필요합니다");
  }

  const db = getFirestore();
  const col = db.collection(COLLECTION_OF[kind as VersionKind]);
  const ref = col.doc(version);
  const actorUid = request.auth.uid;
  const actor = await db.collection("users").doc(actorUid).get();
  const actorName = (actor.get("name") as string | null) ?? null;

  const retired = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpsError("not-found", "버전이 없습니다");
    if (snap.get("status") !== "draft") {
      throw new HttpsError(
        "failed-precondition",
        "초안(draft)만 적용할 수 있습니다",
      );
    }
    const errors = validateVersion(
      kind as VersionKind,
      snap.get("data"),
      version,
    );
    if (errors.length > 0) {
      throw new HttpsError(
        "invalid-argument",
        `검증 실패: ${errors.join(" / ")}`,
      );
    }
    const actives = await tx.get(col.where("status", "==", "active"));
    const now = FieldValue.serverTimestamp();
    for (const a of actives.docs) {
      tx.update(a.ref, { status: "retired", retiredAt: now });
    }
    tx.update(ref, {
      status: "active",
      effectiveFrom: now,
      approvedBy: actorUid,
      approvedByName: actorName,
      approvedAt: now,
    });
    tx.create(db.collection("auditLogs").doc(), {
      path: ref.path,
      actorUid,
      action: "activateVersion",
      before: { status: "draft", retired: actives.docs.map((d) => d.id) },
      after: { status: "active" },
      at: now,
    });
    return actives.docs.map((d) => d.id);
  });
  return { ok: true, version, retired };
});

// 상담 상태·담당자·메모 변경 (CON-02, task.md 9.2). 바뀐 항목마다 events에 이력을 남기고,
// 담당자를 배정하면 연결 진단의 assigneeUid에 복사한다(사진 "담당 건" 권한 판정용).
export const updateConsultation = onCall(async (request) => {
  if (!request.auth)
    throw new HttpsError("unauthenticated", "로그인이 필요합니다");
  const token = request.auth.token as Record<string, unknown>;
  const actorUid = request.auth.uid;
  const { id, ...rest } = (request.data ?? {}) as Record<string, unknown>;
  if (typeof id !== "string" || id === "")
    throw new HttpsError("invalid-argument", "상담 id가 필요합니다");

  const db = getFirestore();
  const ref = db.collection("consultations").doc(id);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpsError("not-found", "상담이 없습니다");
    const current = {
      status: snap.get("status") as string,
      assigneeUid: (snap.get("assigneeUid") as string | null) ?? null,
      // 운영팀 메모 (신청인이 쓴 memo와 따로 둔다)
      memo: (snap.get("staffMemo") as string | null) ?? "",
    };
    if (!canHandle(token, actorUid, current.assigneeUid)) {
      throw new HttpsError(
        "permission-denied",
        "이 상담을 다룰 권한이 없습니다",
      );
    }
    const plan = planUpdate(current, rest);
    if (!plan.ok) throw new HttpsError("invalid-argument", plan.error);
    if (plan.events.length === 0) return;

    const { memo, ...rest2 } = plan.changes;
    const update: Record<string, unknown> = {
      ...rest2,
      ...(memo !== undefined ? { staffMemo: memo } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (plan.changes.assigneeUid !== undefined) {
      if (!canManageAll(token)) {
        throw new HttpsError(
          "permission-denied",
          "담당자 배정은 전체 상담 권한이 있어야 합니다",
        );
      }
      let assigneeName: string | null = null;
      if (plan.changes.assigneeUid) {
        const user = await tx.get(
          db.collection("users").doc(plan.changes.assigneeUid),
        );
        if (
          !user.exists ||
          !["staff", "admin"].includes(user.get("role") as string)
        ) {
          throw new HttpsError(
            "invalid-argument",
            "운영팀 계정에만 배정할 수 있습니다",
          );
        }
        assigneeName = (user.get("name") as string | null) ?? null;
      }
      update.assigneeName = assigneeName;
      const assessmentId = snap.get("assessmentId") as string | null;
      if (assessmentId) {
        tx.update(db.collection("assessments").doc(assessmentId), {
          assigneeUid: plan.changes.assigneeUid,
        });
      }
    }
    tx.update(ref, update);
    for (const e of plan.events) {
      tx.create(ref.collection("events").doc(), {
        ...e,
        actorUid,
        at: FieldValue.serverTimestamp(),
      });
    }
  });
  return { ok: true };
});

// 전화 접수 대리 입력 (CON-02). 회원 계정 없이 운영팀(전체 상담 권한)이 상담을 만든다.
export const createProxyConsultation = onCall(async (request) => {
  if (
    !request.auth ||
    !canManageAll(request.auth.token as Record<string, unknown>)
  ) {
    throw new HttpsError(
      "permission-denied",
      "전체 상담 권한이 있어야 대리 입력할 수 있습니다",
    );
  }
  const parsed = parseProxyInput(request.data);
  if (!parsed.ok) throw new HttpsError("invalid-argument", parsed.error);
  const db = getFirestore();
  const ref = db.collection("consultations").doc();
  const now = FieldValue.serverTimestamp();
  await ref.create({
    ...parsed.value,
    uid: null,
    assessmentId: null,
    snapshotId: null,
    phoneRequested: true,
    status: "received",
    assigneeUid: null,
    assigneeName: null,
    proxyEnteredBy: request.auth.uid,
    createdAt: now,
    updatedAt: now,
  });
  return { ok: true, id: ref.id };
});

// ── 외부 API (task.md 4.1~4.6) ──────────────────────────────────────────────
// 키는 Secret Manager에 있다(npx firebase functions:secrets:set 이름). 키가 저장되기 전에는 이 함수들을 배포할 수 없다.
const JUSO_API_KEY = defineSecret("JUSO_API_KEY");
const DATA_GO_KR_KEY = defineSecret("DATA_GO_KR_KEY");
const VWORLD_API_KEY = defineSecret("VWORLD_API_KEY");
const KAKAO_REST_API_KEY = defineSecret("KAKAO_REST_API_KEY");

async function externalDeps(): Promise<Deps> {
  const db = getFirestore();
  // 시연 스위치: config/demo.useFixtures (콘솔에서 바꾼다)
  const demo = await db.collection("config").doc("demo").get();
  return {
    fetchJson: (url, opts) => fetchJson(url, opts),
    readCache: (api, key, days) => readCache(db, api, key, days),
    writeCache: (api, key, value) => writeCache(db, api, key, value),
    fixtures: DEMO_FIXTURES,
    useFixtures: demo.get("useFixtures") === true,
    now: () => new Date(),
  };
}

// 주소 검색 (SIM-01). 실패하면 { ok: false }를 돌려주고 화면은 직접 입력으로 안내한다.
export const searchAddress = onCall(
  { secrets: [JUSO_API_KEY, KAKAO_REST_API_KEY], timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth)
      throw new HttpsError("unauthenticated", "로그인이 필요합니다");
    const keyword = (request.data as { keyword?: unknown } | undefined)
      ?.keyword;
    if (
      typeof keyword !== "string" ||
      keyword.trim().length < 2 ||
      keyword.length > 80
    ) {
      throw new HttpsError("invalid-argument", "검색어는 2~80자여야 합니다");
    }
    return searchAddressService(
      keyword.trim(),
      { juso: JUSO_API_KEY.value(), kakao: KAKAO_REST_API_KEY.value() },
      await externalDeps(),
    );
  },
);

// 빈집 정보 조회 (SIM-02, 03, 04): 건축물대장·토지·주변 관광지를 출처별로 돌려준다.
export const lookupProperty = onCall(
  { secrets: [DATA_GO_KR_KEY, VWORLD_API_KEY], timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth)
      throw new HttpsError("unauthenticated", "로그인이 필요합니다");
    const { pnu, lat, lng } = (request.data ?? {}) as Record<string, unknown>;
    const okNum = (v: unknown) =>
      v === null || (typeof v === "number" && Number.isFinite(v));
    if (
      !(pnu === null || (typeof pnu === "string" && /^\d{19}$/.test(pnu))) ||
      !okNum(lat) ||
      !okNum(lng)
    ) {
      throw new HttpsError(
        "invalid-argument",
        "pnu(19자리)·좌표 형식이 올바르지 않습니다",
      );
    }
    return lookupPropertyService(
      {
        pnu: pnu as string | null,
        lat: lat as number | null,
        lng: lng as number | null,
      },
      { dataGoKr: DATA_GO_KR_KEY.value(), vworld: VWORLD_API_KEY.value() },
      await externalDeps(),
    );
  },
);
