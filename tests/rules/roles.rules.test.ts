import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

// 역할별 권한표 점검 (task.md 10.1, prd.md 4절, 10/19). 팀원 4명의 권장 권한(lib/members/form.ts PRESETS)으로
// 사진 권한(all/assigned/none)·상담 권한(all/assigned/none)과, 아직 기능이 없는 권한 키가 다른 쓰기를 열지 않는지 본다.

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
    // a1은 원일 담당, a2는 담당 없음
    await setDoc(doc(db, "assessments/a1"), {
      uid: "alice",
      assigneeUid: "wonil",
      status: "consult",
    });
    await setDoc(doc(db, "assessments/a2"), {
      uid: "alice",
      assigneeUid: null,
      status: "saved",
    });
    await setDoc(doc(db, "assessments/a1/photos/p1"), { part: "front" });
    await setDoc(doc(db, "assessments/a2/photos/p2"), { part: "front" });
    // 상담: c1은 석원 담당, c2는 원일 담당
    await setDoc(doc(db, "consultations/c1"), {
      uid: "alice",
      assigneeUid: "seokwon",
      status: "received",
    });
    await setDoc(doc(db, "consultations/c2"), {
      uid: "alice",
      assigneeUid: "wonil",
      status: "received",
    });
    await setDoc(doc(db, "priceVersions/v1"), { status: "active", data: {} });
    await setDoc(doc(db, "branches/onkiro-1"), { name: "1호점" });
  });
});

// lib/members/form.ts PRESETS와 같은 클레임
const seokwon = () =>
  env
    .authenticatedContext("seokwon", {
      role: "staff",
      photoAccess: "all",
      consultAccess: "assigned",
      perms: ["canEditPrices", "canReviewDiagnosis", "canReviewCosts"],
    })
    .firestore();
const wonil = () =>
  env
    .authenticatedContext("wonil", {
      role: "staff",
      photoAccess: "assigned",
      consultAccess: "all",
      perms: ["canEditAssumptions", "canEnterBranchRecords"],
    })
    .firestore();
const haesoon = () =>
  env
    .authenticatedContext("haesoon", {
      role: "staff",
      photoAccess: "none",
      consultAccess: "none",
      perms: ["canEditContent"],
    })
    .firestore();
const approver = () =>
  env
    .authenticatedContext("x", {
      role: "staff",
      photoAccess: "none",
      consultAccess: "none",
      perms: ["canApproveVersions"],
    })
    .firestore();

describe("사진 권한 photoAccess (진단 사진 기록)", () => {
  it("전체(석원)는 모든 진단 사진 기록을 본다", async () => {
    await assertSucceeds(getDoc(doc(seokwon(), "assessments/a1/photos/p1")));
    await assertSucceeds(getDoc(doc(seokwon(), "assessments/a2/photos/p2")));
  });
  it("담당 건(원일)은 자기가 담당인 진단만", async () => {
    await assertSucceeds(getDoc(doc(wonil(), "assessments/a1/photos/p1")));
    await assertFails(getDoc(doc(wonil(), "assessments/a2/photos/p2")));
  });
  it("없음(해순)은 사진 기록을 못 본다", async () => {
    await assertFails(getDoc(doc(haesoon(), "assessments/a1/photos/p1")));
  });
  it("운영팀은 회원 사진 기록을 지우지 못한다", async () => {
    await assertFails(deleteDoc(doc(seokwon(), "assessments/a1/photos/p1")));
  });
});

describe("상담 권한 consultAccess", () => {
  it("담당 건(석원)은 자기 담당 상담과 그 진단만", async () => {
    await assertSucceeds(getDoc(doc(seokwon(), "consultations/c1")));
    await assertFails(getDoc(doc(seokwon(), "consultations/c2")));
  });
  it("전체(원일)는 모든 상담을 본다", async () => {
    await assertSucceeds(getDoc(doc(wonil(), "consultations/c1")));
    await assertSucceeds(getDoc(doc(wonil(), "consultations/c2")));
  });
  it("없음(해순)은 상담을 못 본다", async () => {
    await assertFails(getDoc(doc(haesoon(), "consultations/c1")));
  });
  it("상담 상태는 누구도 화면에서 직접 못 바꾼다(서버 함수만)", async () => {
    await assertFails(
      updateDoc(doc(wonil(), "consultations/c1"), { status: "contacted" }),
    );
  });
});

describe("아직 기능이 없는 권한 키는 다른 쓰기를 열지 않는다", () => {
  it("검수·실제 공사비(석원)로 진단을 고칠 수 없다", async () => {
    await assertFails(
      updateDoc(doc(seokwon(), "assessments/a1"), { status: "saved" }),
    );
  });
  it("지점 실적(원일)으로 숙소를 고칠 수 없다", async () => {
    await assertFails(
      updateDoc(doc(wonil(), "branches/onkiro-1"), { name: "x" }),
    );
  });
  it("버전 승인 권한만으로 단가 DB를 고치거나 적용할 수 없다(적용은 서버 함수)", async () => {
    await assertFails(
      updateDoc(doc(approver(), "priceVersions/v1"), { status: "retired" }),
    );
    await assertFails(
      setDoc(doc(approver(), "priceVersions/v2"), { status: "draft" }),
    );
  });
});
