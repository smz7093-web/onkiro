import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

// firestore.rules 테스트 (task.md 2.4, 10.1). `npm run test:rules`로 에뮬레이터 위에서 실행한다.
let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-onkiro",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});

afterAll(() => env.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "users/other"), { name: "다른 회원", role: "member" });
    await setDoc(doc(db, "users/alice"), { name: "앨리스", role: "member" });
    await setDoc(doc(db, "auditLogs/log1"), { action: "setUserPermissions" });
    await setDoc(doc(db, "assessments/a1"), {
      uid: "alice",
      status: "draft",
      reached: "address",
      checklist: {},
      propertyId: null,
    });
    await setDoc(doc(db, "properties/p1"), {
      ownerUid: "alice",
      addressRoad: "홍성군 1",
      noRegistry: false,
      facts: {},
    });
    await setDoc(doc(db, "properties/p2"), {
      ownerUid: "other",
      addressRoad: "홍성군 2",
      noRegistry: false,
      facts: {},
    });
  });
});

// prd.md 4절 계정 예시와 같은 클레임
const member = () => env.authenticatedContext("alice").firestore();
const newcomer = () => env.authenticatedContext("bob").firestore();
const admin = () =>
  env.authenticatedContext("pm", { role: "admin" }).firestore();
const staff = () =>
  env
    .authenticatedContext("juyeon", {
      role: "staff",
      photoAccess: "none",
      consultAccess: "all",
      perms: ["canEnterBranchRecords"],
    })
    .firestore();
const anonymous = () => env.unauthenticatedContext().firestore();

const consent = {
  type: "terms",
  version: "draft-2026-10-08",
  agreed: true,
  agreedAt: serverTimestamp(),
};

describe("users/{uid}", () => {
  it("로그인하지 않으면 읽을 수 없다", async () => {
    await assertFails(getDoc(doc(anonymous(), "users/alice")));
  });

  it("본인 문서는 읽고 다른 회원 문서는 읽지 못한다", async () => {
    await assertSucceeds(getDoc(doc(member(), "users/alice")));
    await assertFails(getDoc(doc(member(), "users/other")));
  });

  it("관리자는 모든 회원 문서를 읽고, 운영팀은 읽지 못한다", async () => {
    await assertSucceeds(getDoc(doc(admin(), "users/other")));
    await assertFails(getDoc(doc(staff(), "users/other")));
  });

  it("처음 로그인한 회원은 member 문서만 만들 수 있다", async () => {
    const db = newcomer();
    await assertFails(
      setDoc(doc(db, "users/bob"), {
        name: "밥",
        role: "admin",
        createdAt: serverTimestamp(),
      }),
    );
    await assertFails(
      setDoc(doc(db, "users/bob"), {
        name: "밥",
        role: "member",
        createdAt: serverTimestamp(),
        canEditPrices: true,
      }),
    );
    await assertSucceeds(
      setDoc(doc(db, "users/bob"), {
        name: "밥",
        role: "member",
        createdAt: serverTimestamp(),
      }),
    );
  });

  it("다른 사람 uid로는 만들 수 없다", async () => {
    await assertFails(
      setDoc(doc(newcomer(), "users/carol"), {
        name: "캐럴",
        role: "member",
        createdAt: serverTimestamp(),
      }),
    );
  });

  it("본인은 이름·전화만 고치고 권한 필드는 고치지 못한다", async () => {
    const db = member();
    await assertSucceeds(
      updateDoc(doc(db, "users/alice"), { name: "앨리스2" }),
    );
    await assertFails(updateDoc(doc(db, "users/alice"), { role: "admin" }));
    await assertFails(
      updateDoc(doc(db, "users/alice"), { photoAccess: "all" }),
    );
  });

  it("회원 문서는 삭제할 수 없다", async () => {
    await assertFails(deleteDoc(doc(member(), "users/alice")));
  });
});

describe("users/{uid}/consents", () => {
  it("본인은 동의 기록을 추가할 수 있다", async () => {
    await assertSucceeds(
      addDoc(collection(member(), "users/alice/consents"), consent),
    );
  });

  it("다른 회원의 동의 기록은 추가할 수 없다", async () => {
    await assertFails(
      addDoc(collection(member(), "users/other/consents"), consent),
    );
  });

  it("모르는 항목이나 필드는 거부한다", async () => {
    const db = member();
    await assertFails(
      addDoc(collection(db, "users/alice/consents"), {
        ...consent,
        type: "marketing",
      }),
    );
    await assertFails(
      addDoc(collection(db, "users/alice/consents"), { ...consent, extra: 1 }),
    );
  });

  it("동의 기록은 고치거나 지울 수 없다", async () => {
    const db = member();
    const ref = await addDoc(collection(db, "users/alice/consents"), consent);
    await assertFails(updateDoc(ref, { agreed: false }));
    await assertFails(deleteDoc(ref));
  });
});

describe("auditLogs", () => {
  it("관리자만 읽고 누구도 쓰지 못한다", async () => {
    await assertSucceeds(getDoc(doc(admin(), "auditLogs/log1")));
    await assertFails(getDoc(doc(staff(), "auditLogs/log1")));
    await assertFails(getDoc(doc(member(), "auditLogs/log1")));
    await assertFails(setDoc(doc(admin(), "auditLogs/log2"), { action: "x" }));
  });
});

const newAssessment = (uid: string) => ({
  uid,
  propertyId: null,
  address: null,
  status: "draft",
  reached: "address",
  checklist: {},
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

describe("assessments·properties (진단)", () => {
  it("본인 진단만 만들고, draft로만 시작한다", async () => {
    await assertSucceeds(
      setDoc(doc(member(), "assessments/a2"), newAssessment("alice")),
    );
    await assertFails(
      setDoc(doc(member(), "assessments/a3"), newAssessment("other")),
    );
    await assertFails(
      setDoc(doc(member(), "assessments/a4"), {
        ...newAssessment("alice"),
        status: "saved",
      }),
    );
  });

  it("본인 진단만 읽는다, 관리자는 읽을 수 있다", async () => {
    await assertSucceeds(getDoc(doc(member(), "assessments/a1")));
    await assertFails(getDoc(doc(newcomer(), "assessments/a1")));
    await assertSucceeds(getDoc(doc(admin(), "assessments/a1")));
  });

  it("단계·체크리스트는 고치고, 상태·주인은 못 고친다", async () => {
    const ref = doc(member(), "assessments/a1");
    await assertSucceeds(
      updateDoc(ref, {
        reached: "confirm",
        checklist: { leak: "no" },
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(ref, { status: "saved", updatedAt: serverTimestamp() }),
    );
    await assertFails(
      updateDoc(ref, { uid: "bob", updatedAt: serverTimestamp() }),
    );
  });

  it("빈집 문서를 만들며 진단에 연결할 수 있고, 남의 빈집은 연결하지 못한다", async () => {
    const db = member();
    const batch = writeBatch(db);
    batch.set(doc(db, "properties/p3"), {
      ownerUid: "alice",
      addressRoad: "홍성군 3",
      addressJibun: null,
      pnu: null,
      lat: null,
      lng: null,
      noRegistry: false,
      facts: {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.update(doc(db, "assessments/a1"), {
      propertyId: "p3",
      address: "홍성군 3",
      updatedAt: serverTimestamp(),
    });
    await assertSucceeds(batch.commit());
    await assertFails(
      updateDoc(doc(db, "assessments/a1"), {
        propertyId: "p2",
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it("빈집 정보는 주인만 읽고 고친다", async () => {
    await assertSucceeds(getDoc(doc(member(), "properties/p1")));
    await assertFails(getDoc(doc(member(), "properties/p2")));
    await assertSucceeds(
      updateDoc(doc(member(), "properties/p1"), {
        facts: { floorArea: { value: 72, source: "manual" } },
        noRegistry: true,
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(doc(member(), "properties/p1"), {
        ownerUid: "bob",
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it("사진 기록은 진단 주인만 만들고, 사진 권한 없는 운영팀은 못 읽는다", async () => {
    const photo = {
      part: "front",
      storagePath: "assessments/a1/photos/ph1.jpg",
      exifStripped: true,
      consentModelUse: false,
      deleteAfter: null,
      width: 1600,
      height: 1200,
      size: 300000,
      createdAt: serverTimestamp(),
    };
    await assertSucceeds(
      setDoc(doc(member(), "assessments/a1/photos/ph1"), photo),
    );
    await assertFails(
      setDoc(doc(newcomer(), "assessments/a1/photos/ph2"), photo),
    );
    await assertFails(
      setDoc(doc(member(), "assessments/a1/photos/ph3"), {
        ...photo,
        exifStripped: false,
      }),
    );
    await assertFails(getDoc(doc(staff(), "assessments/a1/photos/ph1")));
    await assertSucceeds(getDoc(doc(admin(), "assessments/a1/photos/ph1")));
  });
});

describe("branches", () => {
  it("숙소 상세는 누구나 읽고, 아직 아무도 쓰지 못한다", async () => {
    await assertSucceeds(getDoc(doc(anonymous(), "branches/b1")));
    await assertFails(setDoc(doc(admin(), "branches/b1"), { name: "x" }));
  });

  it("지점 실적 하위 컬렉션은 막혀 있다", async () => {
    await assertFails(
      getDoc(doc(anonymous(), "branches/b1/dailyRecords/2026-10-10")),
    );
  });
});

describe("나머지 경로", () => {
  it("규칙이 없는 컬렉션은 관리자도 막힌다", async () => {
    await assertFails(getDoc(doc(admin(), "consultations/c1")));
    await assertFails(setDoc(doc(admin(), "consultations/c1"), { x: 1 }));
  });
});
