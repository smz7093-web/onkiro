import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

// 단가 DB·가정값 버전 규칙 (task.md 5.3). `npm run test:rules`로 실행한다.
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
    await setDoc(doc(db, "priceVersions/v1"), { status: "active", data: { version: "v1" } });
    await setDoc(doc(db, "priceVersions/v0"), { status: "retired", data: { version: "v0" } });
    await setDoc(doc(db, "priceVersions/v2"), {
      status: "draft",
      data: { version: "v2" },
      createdBy: "seokwon",
    });
  });
});

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
      consultAccess: "assigned",
      perms: ["canEditAssumptions"],
    })
    .firestore();
const member = () => env.authenticatedContext("alice").firestore();

const newDraft = (uid: string, version: string) => ({
  status: "draft",
  data: { version },
  note: "",
  basedOn: "v1",
  createdBy: uid,
  createdByName: null,
  createdAt: serverTimestamp(),
  updatedBy: uid,
  updatedByName: null,
  updatedAt: serverTimestamp(),
});

describe("priceVersions", () => {
  it("회원은 적용 버전만 읽는다", async () => {
    await assertSucceeds(getDoc(doc(member(), "priceVersions/v1")));
    await assertFails(getDoc(doc(member(), "priceVersions/v2")));
    await assertSucceeds(
      getDocs(query(collection(member(), "priceVersions"), where("status", "==", "active"))),
    );
    await assertFails(getDocs(collection(member(), "priceVersions")));
  });

  it("운영팀은 모든 버전을 읽는다", async () => {
    await assertSucceeds(getDocs(collection(wonil(), "priceVersions")));
  });

  it("단가 편집 권한자만 초안을 만든다", async () => {
    await assertSucceeds(setDoc(doc(seokwon(), "priceVersions/v3"), newDraft("seokwon", "v3")));
    await assertFails(setDoc(doc(wonil(), "priceVersions/v4"), newDraft("wonil", "v4")));
  });

  it("처음부터 적용 상태로 만들거나 버전 이름이 다르면 거부한다", async () => {
    await assertFails(
      setDoc(doc(seokwon(), "priceVersions/v3"), { ...newDraft("seokwon", "v3"), status: "active" }),
    );
    await assertFails(setDoc(doc(seokwon(), "priceVersions/v3"), newDraft("seokwon", "v9")));
  });

  it("초안은 고치고 지울 수 있지만 status는 바꾸지 못한다", async () => {
    const ref = doc(seokwon(), "priceVersions/v2");
    const edit = { data: { version: "v2", fixedDays: 6 }, updatedBy: "seokwon", updatedAt: serverTimestamp() };
    await assertSucceeds(updateDoc(ref, edit));
    await assertFails(updateDoc(ref, { ...edit, status: "active" }));
    await assertSucceeds(deleteDoc(ref));
  });

  it("적용·이전 버전은 고치거나 지우지 못한다", async () => {
    const edit = { data: { version: "v1" }, updatedBy: "seokwon", updatedAt: serverTimestamp() };
    await assertFails(updateDoc(doc(seokwon(), "priceVersions/v1"), edit));
    await assertFails(deleteDoc(doc(seokwon(), "priceVersions/v1")));
    await assertFails(deleteDoc(doc(seokwon(), "priceVersions/v0")));
  });
});

describe("assumptionVersions", () => {
  it("가정값 편집 권한자만 초안을 만든다", async () => {
    await assertSucceeds(setDoc(doc(wonil(), "assumptionVersions/v0.4"), newDraft("wonil", "v0.4")));
    await assertFails(setDoc(doc(seokwon(), "assumptionVersions/v0.5"), newDraft("seokwon", "v0.5")));
  });
});
