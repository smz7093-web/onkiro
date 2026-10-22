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
  it("AI 이용 선택 동의(aiProcessing, 10/19)를 본인이 남길 수 있고, 모르는 종류는 막는다", async () => {
    await assertSucceeds(
      addDoc(collection(member(), "users/alice/consents"), {
        ...consent,
        type: "aiProcessing",
        version: "draft-2026-10-19",
      }),
    );
    await assertFails(
      addDoc(collection(member(), "users/alice/consents"), {
        ...consent,
        type: "marketing",
      }),
    );
  });

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

  it("완료 전(draft) 진단은 주인만 빈집 문서와 함께 지울 수 있다", async () => {
    await assertFails(deleteDoc(doc(newcomer(), "assessments/a1")));
    await assertFails(deleteDoc(doc(newcomer(), "properties/p1")));
    const db = member();
    const batch = writeBatch(db);
    batch.delete(doc(db, "assessments/a1"));
    batch.delete(doc(db, "properties/p1"));
    await assertSucceeds(batch.commit());
  });

  it("견적이 나왔거나 상담에 연결된 진단은 주인도 지우지 못한다", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, "assessments/saved1"), {
        uid: "alice",
        status: "saved",
        latestSnapshotId: "s1",
      });
      await setDoc(doc(db, "assessments/draft-linked"), {
        uid: "alice",
        status: "draft",
        lastConsultId: "c1",
      });
    });
    await assertFails(deleteDoc(doc(member(), "assessments/saved1")));
    await assertFails(deleteDoc(doc(member(), "assessments/draft-linked")));
  });

  it("사진 기록은 진단 주인만 만들고, 사진 권한 없는 운영팀은 못 읽는다", async () => {
    const photo = {
      part: "front",
      storagePath: "users/alice/assessments/a1/photos/ph1.jpg",
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

describe("snapshots (계산 스냅샷)", () => {
  const snapshot = {
    inputs: {},
    options: { module: "B", demolition: false },
    result: {},
    priceVersion: "v2026.10-1",
    assumptionVersion: "v0.3",
    formulaVersion: "v1.0",
    inputsKey: "abcd1234",
    reason: "view",
    parentSnapshotId: null,
    createdBy: "alice",
    createdAt: serverTimestamp(),
  };

  it("스냅샷을 만들며 진단을 saved로 바꾸고, 스냅샷은 고칠 수 없다", async () => {
    const db = member();
    const batch = writeBatch(db);
    batch.set(doc(db, "assessments/a1/snapshots/s1"), snapshot);
    batch.update(doc(db, "assessments/a1"), {
      latestSnapshotId: "s1",
      latestInputsKey: "abcd1234",
      status: "saved",
      updatedAt: serverTimestamp(),
    });
    await assertSucceeds(batch.commit());
    await assertFails(
      updateDoc(doc(db, "assessments/a1/snapshots/s1"), { reason: "save" }),
    );
    await assertFails(deleteDoc(doc(db, "assessments/a1/snapshots/s1")));
  });

  it("없는 스냅샷을 연결하거나 consult로 바꾸지 못한다", async () => {
    const ref = doc(member(), "assessments/a1");
    await assertFails(
      updateDoc(ref, {
        latestSnapshotId: "nope",
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(ref, { status: "consult", updatedAt: serverTimestamp() }),
    );
  });

  it("다른 사람 진단에는 스냅샷을 만들 수 없다", async () => {
    await assertFails(
      setDoc(doc(newcomer(), "assessments/a1/snapshots/s2"), {
        ...snapshot,
        createdBy: "bob",
      }),
    );
  });
});

describe("consultations (상담)", () => {
  const consult = (uid: string, assessmentId: string | null = null) => ({
    uid,
    type: "inspection",
    assessmentId,
    snapshotId: null,
    applicantName: "앨리스",
    phone: "010-1234-5678",
    ownership: "self",
    preferredDate: null,
    memo: "",
    phoneRequested: false,
    status: "received",
    assigneeUid: null,
    assigneeName: null,
    proxyEnteredBy: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  it("회원은 본인 진단에 상담을 신청하며 진단을 consult로 바꾼다", async () => {
    const db = member();
    const batch = writeBatch(db);
    batch.set(doc(db, "consultations/c1"), consult("alice", "a1"));
    batch.update(doc(db, "assessments/a1"), {
      status: "consult",
      lastConsultId: "c1",
      updatedAt: serverTimestamp(),
    });
    await assertSucceeds(batch.commit());
    await assertSucceeds(getDoc(doc(db, "consultations/c1")));
  });

  it("남의 진단에 연결하거나 접수 외 상태로 만들 수 없다", async () => {
    await assertFails(
      setDoc(doc(newcomer(), "consultations/c2"), consult("bob", "a1")),
    );
    await assertFails(
      setDoc(doc(member(), "consultations/c3"), {
        ...consult("alice"),
        status: "contracted",
      }),
    );
  });

  it("회원은 상담을 고칠 수 없고, 전체 상담 권한 운영팀은 읽는다", async () => {
    await assertSucceeds(
      setDoc(doc(member(), "consultations/c4"), consult("alice")),
    );
    await assertFails(
      updateDoc(doc(member(), "consultations/c4"), { status: "contacted" }),
    );
    await assertSucceeds(getDoc(doc(staff(), "consultations/c4")));
    await assertFails(getDoc(doc(newcomer(), "consultations/c4")));
  });
});

describe("siteContent (D7 인허가·D9 촬영 가이드 문구, 10/15)", () => {
  const permits = (uid: string) => ({
    general: [{ id: "g1", title: "민박 신고", nextAction: "문의", agency: "" }],
    conditional: {},
    updatedBy: uid,
    updatedByName: null,
    updatedAt: serverTimestamp(),
  });
  const guides = (uid: string) => ({
    guides: { front: "집 전체가 나오게" },
    updatedBy: uid,
    updatedByName: null,
    updatedAt: serverTimestamp(),
  });
  const wonil = () =>
    env
      .authenticatedContext("wonil", {
        role: "staff",
        perms: ["canEditAssumptions"],
      })
      .firestore();
  const haesoon = () =>
    env
      .authenticatedContext("haesoon", {
        role: "staff",
        perms: ["canEditContent"],
      })
      .firestore();

  it("누구나 읽고, 인허가는 가정값·콘텐츠 권한, 촬영 가이드는 콘텐츠 권한만 쓴다", async () => {
    await assertSucceeds(getDoc(doc(anonymous(), "siteContent/permits")));
    await assertSucceeds(
      setDoc(doc(wonil(), "siteContent/permits"), permits("wonil")),
    );
    await assertSucceeds(
      setDoc(doc(haesoon(), "siteContent/permits"), permits("haesoon")),
    );
    await assertSucceeds(
      setDoc(doc(haesoon(), "siteContent/photoGuides"), guides("haesoon")),
    );
    await assertSucceeds(
      setDoc(doc(admin(), "siteContent/photoGuides"), guides("pm")),
    );
    await assertFails(
      setDoc(doc(wonil(), "siteContent/photoGuides"), guides("wonil")),
    );
    await assertFails(
      setDoc(doc(member(), "siteContent/permits"), permits("alice")),
    );
  });

  it("정해진 문서·필드만, 작성자 위장·삭제 금지", async () => {
    await assertFails(setDoc(doc(admin(), "siteContent/home"), guides("pm")));
    await assertFails(
      setDoc(doc(admin(), "siteContent/permits"), {
        ...permits("pm"),
        extra: 1,
      }),
    );
    await assertFails(
      setDoc(doc(wonil(), "siteContent/permits"), permits("pm")),
    );
    await assertFails(deleteDoc(doc(admin(), "siteContent/permits")));
  });
});

describe("branches", () => {
  const branch = (uid: string) => ({
    name: "1호점",
    content: { headline: "감나무집" },
    airbnbUrl: null,
    naverUrl: null,
    updatedBy: uid,
    updatedByName: null,
    updatedAt: serverTimestamp(),
  });

  it("숙소 상세는 누구나 읽고, 콘텐츠 편집 권한자만 쓴다", async () => {
    await assertSucceeds(getDoc(doc(anonymous(), "branches/b1")));
    await assertSucceeds(
      setDoc(doc(admin(), "branches/hongseong-1"), branch("pm")),
    );
    const editor = env
      .authenticatedContext("haesoon", {
        role: "staff",
        perms: ["canEditContent"],
      })
      .firestore();
    await assertSucceeds(
      setDoc(doc(editor, "branches/hongseong-2"), branch("haesoon")),
    );
    await assertFails(
      setDoc(doc(staff(), "branches/hongseong-3"), branch("juyeon")),
    );
    await assertFails(
      setDoc(doc(member(), "branches/hongseong-4"), branch("alice")),
    );
  });

  it("숙소 id 형식과 필드를 검사하고, 삭제는 막는다", async () => {
    await assertFails(
      setDoc(doc(admin(), "branches/Hong Seong"), branch("pm")),
    );
    await assertFails(
      setDoc(doc(admin(), "branches/b2"), { ...branch("pm"), price: 1 }),
    );
    await assertFails(deleteDoc(doc(admin(), "branches/b1")));
  });

  it("지점 실적 하위 컬렉션은 막혀 있다", async () => {
    await assertFails(
      getDoc(doc(anonymous(), "branches/b1/dailyRecords/2026-10-10")),
    );
  });
});

describe("reservations·bookingCalendars (예약 신청, STY-06)", () => {
  const haesoon = () =>
    env
      .authenticatedContext("haesoon", {
        role: "staff",
        perms: ["canEditContent"],
      })
      .firestore();
  const calendar = (uid: string) => ({
    blocked: ["2026-11-07"],
    updatedBy: uid,
    updatedAt: serverTimestamp(),
  });

  beforeEach(async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, "reservations/r1"), {
        uid: "alice",
        branchId: "onkiro-1",
        status: "requested",
      });
      await setDoc(doc(db, "reservations/r1/events/e1"), { kind: "status" });
      await setDoc(doc(db, "bookingCalendars/onkiro-1"), {
        blocked: [],
        booked: ["2026-11-01"],
      });
    });
  });

  it("예약은 본인과 예약 관리 권한(관리자·콘텐츠 편집)만 읽는다", async () => {
    await assertSucceeds(getDoc(doc(member(), "reservations/r1")));
    await assertSucceeds(getDoc(doc(haesoon(), "reservations/r1")));
    await assertSucceeds(getDoc(doc(admin(), "reservations/r1")));
    await assertFails(getDoc(doc(staff(), "reservations/r1")));
    await assertFails(getDoc(doc(newcomer(), "reservations/r1")));
    await assertFails(getDoc(doc(anonymous(), "reservations/r1")));
    await assertSucceeds(getDoc(doc(haesoon(), "reservations/r1/events/e1")));
    await assertFails(getDoc(doc(member(), "reservations/r1/events/e1")));
  });

  it("예약은 화면에서 직접 만들거나 고치지 못한다(서버 함수만)", async () => {
    await assertFails(
      setDoc(doc(member(), "reservations/r2"), {
        uid: "alice",
        status: "confirmed",
      }),
    );
    await assertFails(
      updateDoc(doc(member(), "reservations/r1"), { status: "cancelled" }),
    );
    await assertFails(
      updateDoc(doc(admin(), "reservations/r1"), { status: "confirmed" }),
    );
  });

  it("달력은 누구나 읽고, 막은 날짜(blocked)만 콘텐츠 편집 권한자가 고친다", async () => {
    await assertSucceeds(getDoc(doc(anonymous(), "bookingCalendars/onkiro-1")));
    await assertSucceeds(
      updateDoc(
        doc(haesoon(), "bookingCalendars/onkiro-1"),
        calendar("haesoon"),
      ),
    );
    await assertSucceeds(
      setDoc(doc(admin(), "bookingCalendars/onkiro-2"), calendar("pm")),
    );
    await assertFails(
      updateDoc(doc(staff(), "bookingCalendars/onkiro-1"), calendar("juyeon")),
    );
    await assertFails(
      updateDoc(doc(member(), "bookingCalendars/onkiro-1"), calendar("alice")),
    );
  });

  it("확정 예약의 밤(booked)은 화면에서 못 바꾸고, 작성자 위장·삭제 금지", async () => {
    await assertFails(
      updateDoc(doc(admin(), "bookingCalendars/onkiro-1"), {
        ...calendar("pm"),
        booked: [],
      }),
    );
    await assertFails(
      updateDoc(doc(haesoon(), "bookingCalendars/onkiro-1"), calendar("pm")),
    );
    await assertFails(deleteDoc(doc(admin(), "bookingCalendars/onkiro-1")));
  });
});

describe("나머지 경로", () => {
  it("규칙이 없는 컬렉션은 관리자도 막힌다", async () => {
    await assertFails(getDoc(doc(admin(), "unknownCollection/x1")));
    await assertFails(setDoc(doc(admin(), "unknownCollection/x1"), { x: 1 }));
  });
});
