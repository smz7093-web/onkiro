import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { DEV_BYPASS, MFA, NO_MFA } from "./mfa";

// 관리자 2단계 인증 강제 (task.md 11.3). 2단계 인증(TOTP) 없이 로그인한 운영팀 토큰은 일반 회원으로 본다.

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-onkiro",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
    storage: { rules: readFileSync("storage.rules", "utf8") },
  });
});

afterAll(() => env.cleanup());

const PHOTO = "users/alice/assessments/a1/photos/ph1.jpg";

beforeEach(async () => {
  await env.clearFirestore();
  await env.clearStorage();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "users/alice"), {
      name: "앨리스",
      role: "member",
    });
    await setDoc(doc(ctx.firestore(), "assessments/a1"), {
      uid: "alice",
      assigneeUid: null,
    });
    await ctx
      .storage()
      .ref(PHOTO)
      .put(new Uint8Array([0xff, 0xd8, 0xff]), { contentType: "image/jpeg" });
  });
});

const adminWith = (extra: Record<string, unknown>) =>
  env.authenticatedContext("pm", { role: "admin", ...extra });
const photoStaffWith = (extra: Record<string, unknown>) =>
  env.authenticatedContext("seokwon", {
    role: "staff",
    photoAccess: "all",
    consultAccess: "none",
    perms: [],
    ...extra,
  });

describe("Firestore", () => {
  it("2단계 인증으로 로그인한 관리자는 다른 회원 문서를 읽는다", async () => {
    await assertSucceeds(
      getDoc(doc(adminWith(MFA).firestore(), "users/alice")),
    );
  });

  it("2단계 인증 없는 관리자 토큰은 일반 회원과 같다", async () => {
    await assertFails(
      getDoc(doc(adminWith(NO_MFA).firestore(), "users/alice")),
    );
    // 기본 토큰(firebase 항목에 2단계 정보 없음)도 마찬가지
    await assertFails(
      getDoc(
        doc(
          env.authenticatedContext("pm", { role: "admin" }).firestore(),
          "users/alice",
        ),
      ),
    );
  });

  it("2단계 인증 없는 운영팀도 자기 회원 문서는 읽는다", async () => {
    await env.withSecurityRulesDisabled((ctx) =>
      setDoc(doc(ctx.firestore(), "users/pm"), { name: "PM", role: "admin" }),
    );
    await assertSucceeds(
      getDoc(doc(adminWith(NO_MFA).firestore(), "users/pm")),
    );
  });

  it("에뮬레이터 예외는 비밀번호 로그인 + devMfaBypass일 때만", async () => {
    await assertSucceeds(
      getDoc(doc(adminWith(DEV_BYPASS).firestore(), "users/alice")),
    );
    // 카카오 로그인 토큰에 devMfaBypass가 있어도 인정하지 않는다
    await assertFails(
      getDoc(
        doc(
          adminWith({ ...NO_MFA, devMfaBypass: true }).firestore(),
          "users/alice",
        ),
      ),
    );
    // 비밀번호 로그인이라도 클레임이 없으면 인정하지 않는다
    await assertFails(
      getDoc(
        doc(
          adminWith({ firebase: { sign_in_provider: "password" } }).firestore(),
          "users/alice",
        ),
      ),
    );
  });

  it("문자 인증(phone) 등 TOTP가 아닌 2단계는 인정하지 않는다", async () => {
    await assertFails(
      getDoc(
        doc(
          adminWith({
            firebase: {
              sign_in_provider: "oidc.kakao",
              sign_in_second_factor: "phone",
            },
          }).firestore(),
          "users/alice",
        ),
      ),
    );
  });
});

describe("Storage", () => {
  it("사진 전체 권한 운영팀은 2단계 인증 로그인일 때만 진단 사진을 읽는다", async () => {
    await assertSucceeds(
      photoStaffWith(MFA).storage().ref(PHOTO).getMetadata(),
    );
    await assertFails(
      photoStaffWith(NO_MFA).storage().ref(PHOTO).getMetadata(),
    );
  });

  it("관리자도 2단계 인증 없으면 진단 사진을 못 읽는다", async () => {
    await assertSucceeds(adminWith(MFA).storage().ref(PHOTO).getMetadata());
    await assertFails(adminWith(NO_MFA).storage().ref(PHOTO).getMetadata());
  });
});
