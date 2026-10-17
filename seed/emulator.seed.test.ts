// 로컬 에뮬레이터 시드 (10/17, task.md 9.5·10.2): 시연 계정 2개, 적용 중 기준값, 1호점 숙소.
// 순서: 루트 `npm run emulators:app` → `npm run seed:emulator` → web `npm run dev:emu` (http://localhost:3001)
// 실제 Firebase에는 접속하지 않는다(프로젝트 demo-onkiro, 127.0.0.1 에뮬레이터).
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { readFileSync } from "node:fs";
import { it } from "vitest";
import { CONSENT_ITEMS } from "../web/src/lib/consent/definitions";
import {
  ASSUMPTION_V0_3,
  PRICE_V2026_10_1,
} from "../web/src/lib/engine/defaults";
import { SAMPLE_BRANCHES } from "../web/src/lib/branches/sample";

const PROJECT = "demo-onkiro";
const AUTH = "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1";
export const DEMO_PASSWORD = "onkiro-demo";
export const DEMO_ACCOUNTS = [
  {
    email: "pm@onkiro.test",
    name: "PM(시연)",
    role: "admin",
    claims: { role: "admin" },
  },
  { email: "member@onkiro.test", name: "김빈집", role: "member", claims: {} },
] as const;

async function authCall(path: string, body: unknown, owner = false) {
  const res = await fetch(`${AUTH}/${path}${owner ? "" : "?key=fake"}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(owner ? { authorization: "Bearer owner" } : {}),
    },
    body: JSON.stringify(body),
  });
  return (await res.json()) as { localId?: string; error?: { message: string } };
}

async function ensureUser(email: string, name: string, claims: object) {
  let r = await authCall("accounts:signUp", {
    email,
    password: DEMO_PASSWORD,
    displayName: name,
  });
  if (r.error?.message === "EMAIL_EXISTS")
    r = await authCall("accounts:signInWithPassword", {
      email,
      password: DEMO_PASSWORD,
    });
  if (!r.localId) throw new Error(`계정 생성 실패 ${email}: ${r.error?.message}`);
  await authCall(
    `projects/${PROJECT}/accounts:update`,
    { localId: r.localId, customAttributes: JSON.stringify(claims) },
    true,
  );
  return r.localId;
}

it("에뮬레이터 시드", async () => {
  const env = await initializeTestEnvironment({
    projectId: PROJECT,
    firestore: {
      host: "127.0.0.1",
      port: 8080,
      rules: readFileSync("firestore.rules", "utf8"),
    },
  });
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const a of DEMO_ACCOUNTS) {
      const uid = await ensureUser(a.email, a.name, a.claims);
      await setDoc(doc(db, "users", uid), {
        name: a.name,
        role: a.role,
        createdAt: serverTimestamp(),
      });
      for (const c of CONSENT_ITEMS)
        await setDoc(doc(db, "users", uid, "consents", c.type), {
          type: c.type,
          version: c.version,
          agreed: true,
          agreedAt: serverTimestamp(),
        });
    }
    const version = (data: object, id: string) => ({
      status: "active",
      data,
      note: "에뮬레이터 시드 (임시 기준값)",
      basedOn: null,
      createdBy: "seed",
      createdByName: "시드",
      createdAt: serverTimestamp(),
      updatedBy: "seed",
      updatedByName: "시드",
      updatedAt: serverTimestamp(),
      approvedBy: "seed",
      approvedByName: "시드",
      effectiveFrom: serverTimestamp(),
      id,
    });
    await setDoc(
      doc(db, "priceVersions", PRICE_V2026_10_1.version),
      version(PRICE_V2026_10_1, PRICE_V2026_10_1.version),
    );
    await setDoc(
      doc(db, "assumptionVersions", ASSUMPTION_V0_3.version),
      version(ASSUMPTION_V0_3, ASSUMPTION_V0_3.version),
    );
    // 1호점: 샘플 내용에 홈 화면과 같은 사진(web/public/home)을 붙인다
    const s = SAMPLE_BRANCHES[0];
    await setDoc(doc(db, "branches", "onkiro-1"), {
      name: "온기로 1호점",
      content: {
        ...s.content,
        photos: [
          { url: "/home/onkiro1.jpg", caption: "거실" },
          { url: "/home/onkiro2.jpg", caption: "다락방" },
        ],
      },
      airbnbUrl: "https://www.airbnb.co.kr/",
      naverUrl: null,
      updatedBy: "seed",
      updatedByName: "시드",
      updatedAt: serverTimestamp(),
    });
  });
  await env.cleanup();
});
