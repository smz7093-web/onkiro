import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, setDoc } from "firebase/firestore";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

// storage.rules 테스트 (task.md 10.1, 10/19). 진단 사진·AI 가상 이미지·숙소 사진·기본 거부.
// 담당 건(assigned) 사진 권한은 Firestore 진단 문서의 assigneeUid를 읽으므로(교차 서비스 규칙) Firestore도 함께 띄운다.

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-onkiro",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
    storage: { rules: readFileSync("storage.rules", "utf8") },
  });
});

afterAll(() => env.cleanup());

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4]);
const jpeg = { contentType: "image/jpeg" };
const PHOTO = "users/alice/assessments/a1/photos/ph1.jpg";
const RENDER = "users/alice/assessments/a1/renders/B-ph1.png";

beforeEach(async () => {
  await env.clearStorage();
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    // a1은 원일이 담당, a2는 담당 없음
    await setDoc(doc(ctx.firestore(), "assessments/a1"), {
      uid: "alice",
      assigneeUid: "wonil",
    });
    await setDoc(doc(ctx.firestore(), "assessments/a2"), {
      uid: "alice",
      assigneeUid: null,
    });
    const s = ctx.storage();
    await s.ref(PHOTO).put(JPEG, jpeg);
    await s.ref("users/alice/assessments/a2/photos/ph9.jpg").put(JPEG, jpeg);
    await s.ref(RENDER).put(JPEG, { contentType: "image/png" });
    await s.ref("branches/onkiro-1/photos/abc.jpg").put(JPEG, jpeg);
  });
});

// prd.md 4절 권장 권한과 같은 클레임
const ctx = {
  anonymous: () => env.unauthenticatedContext().storage(),
  owner: () => env.authenticatedContext("alice").storage(),
  other: () => env.authenticatedContext("bob").storage(),
  admin: () => env.authenticatedContext("pm", { role: "admin" }).storage(),
  // 석원: 사진 전체
  seokwon: () =>
    env
      .authenticatedContext("seokwon", {
        role: "staff",
        photoAccess: "all",
        consultAccess: "assigned",
        perms: ["canEditPrices", "canReviewDiagnosis", "canReviewCosts"],
      })
      .storage(),
  // 원일: 담당 건 사진만
  wonil: () =>
    env
      .authenticatedContext("wonil", {
        role: "staff",
        photoAccess: "assigned",
        consultAccess: "all",
        perms: ["canEditAssumptions", "canEnterBranchRecords"],
      })
      .storage(),
  // 해순: 사진 없음, 콘텐츠 편집
  haesoon: () =>
    env
      .authenticatedContext("haesoon", {
        role: "staff",
        photoAccess: "none",
        consultAccess: "none",
        perms: ["canEditContent"],
      })
      .storage(),
};

const read = (s: ReturnType<typeof ctx.owner>, path: string) =>
  s.ref(path).getMetadata();
const put = (
  s: ReturnType<typeof ctx.owner>,
  path: string,
  data: Uint8Array = JPEG,
  meta: { contentType: string } = jpeg,
) =>
  s
    .ref(path)
    .put(data, meta)
    .then(() => undefined);

describe("진단 사진 users/{uid}/assessments/{aid}/photos", () => {
  it("읽기: 주인·관리자·사진 전체 권한은 되고, 다른 회원·비로그인·사진 권한 없음은 안 된다", async () => {
    await assertSucceeds(read(ctx.owner(), PHOTO));
    await assertSucceeds(read(ctx.admin(), PHOTO));
    await assertSucceeds(read(ctx.seokwon(), PHOTO));
    await assertFails(read(ctx.other(), PHOTO));
    await assertFails(read(ctx.anonymous(), PHOTO));
    await assertFails(read(ctx.haesoon(), PHOTO));
  });

  it("담당 건 권한(원일)은 자기가 담당인 진단 사진만 읽는다", async () => {
    await assertSucceeds(read(ctx.wonil(), PHOTO));
    await assertFails(
      read(ctx.wonil(), "users/alice/assessments/a2/photos/ph9.jpg"),
    );
  });

  it("올리기: 본인 경로에 jpg·image/jpeg·5MB 미만만", async () => {
    await assertSucceeds(
      put(ctx.owner(), "users/alice/assessments/a1/photos/new1.jpg"),
    );
    await assertFails(
      put(ctx.other(), "users/alice/assessments/a1/photos/new2.jpg"),
    );
    await assertFails(
      put(ctx.admin(), "users/alice/assessments/a1/photos/new3.jpg"),
    );
    await assertFails(
      put(ctx.owner(), "users/alice/assessments/a1/photos/new4.png"),
    );
    await assertFails(
      put(ctx.owner(), "users/alice/assessments/a1/photos/new5.jpg", JPEG, {
        contentType: "image/png",
      }),
    );
    await assertFails(
      put(
        ctx.owner(),
        "users/alice/assessments/a1/photos/big.jpg",
        new Uint8Array(5 * 1024 * 1024),
      ),
    );
  });

  it("덮어쓰기는 막고, 지우기는 주인만", async () => {
    await assertFails(put(ctx.owner(), PHOTO));
    await assertFails(ctx.other().ref(PHOTO).delete());
    await assertFails(ctx.admin().ref(PHOTO).delete());
    await assertSucceeds(ctx.owner().ref(PHOTO).delete());
  });
});

describe("AI 가상 이미지 users/{uid}/assessments/{aid}/renders", () => {
  it("읽기는 진단 사진과 같다", async () => {
    await assertSucceeds(read(ctx.owner(), RENDER));
    await assertSucceeds(read(ctx.seokwon(), RENDER));
    await assertSucceeds(read(ctx.wonil(), RENDER));
    await assertFails(read(ctx.other(), RENDER));
    await assertFails(read(ctx.haesoon(), RENDER));
  });

  it("쓰기·지우기는 누구도 못 한다(서버 함수만)", async () => {
    await assertFails(
      put(ctx.owner(), "users/alice/assessments/a1/renders/x.png", JPEG, {
        contentType: "image/png",
      }),
    );
    await assertFails(put(ctx.admin(), RENDER));
    await assertFails(ctx.owner().ref(RENDER).delete());
  });
});

describe("숙소 사진 branches/{id}/photos", () => {
  it("누구나 본다", async () => {
    await assertSucceeds(
      read(ctx.anonymous(), "branches/onkiro-1/photos/abc.jpg"),
    );
  });

  it("콘텐츠 편집 권한자·관리자만 소문자 jpg로 올리고, 고치거나 지울 수 없다", async () => {
    await assertSucceeds(put(ctx.haesoon(), "branches/onkiro-1/photos/n1.jpg"));
    await assertSucceeds(put(ctx.admin(), "branches/onkiro-1/photos/n2.jpg"));
    await assertFails(put(ctx.seokwon(), "branches/onkiro-1/photos/n3.jpg"));
    await assertFails(put(ctx.owner(), "branches/onkiro-1/photos/n4.jpg"));
    await assertFails(put(ctx.haesoon(), "branches/onkiro-1/photos/N5.JPG"));
    await assertFails(put(ctx.haesoon(), "branches/onkiro-1/photos/abc.jpg"));
    await assertFails(
      ctx.admin().ref("branches/onkiro-1/photos/abc.jpg").delete(),
    );
  });
});

describe("나머지 경로", () => {
  it("규칙이 없는 경로는 관리자도 읽고 쓸 수 없다", async () => {
    await assertFails(put(ctx.admin(), "public/anything.jpg"));
    await assertFails(put(ctx.owner(), "users/alice/other/x.jpg"));
    await assertFails(read(ctx.admin(), "users/alice/other/x.jpg"));
  });
});
