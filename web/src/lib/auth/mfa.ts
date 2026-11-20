"use client";

import {
  getMultiFactorResolver,
  multiFactor,
  TotpMultiFactorGenerator,
  type MultiFactorError,
  type MultiFactorResolver,
  type TotpSecret,
  type User,
  type UserCredential,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { httpsCallable } from "firebase/functions";
import { auth, functions, USE_EMULATORS } from "../firebase/client";

// 관리자 2단계 인증 (TOTP 인증 앱, task.md 11.3). 실제 차단은 보안 규칙·서버 함수가 한다
// (2단계 인증 없이 로그인한 운영팀 토큰은 일반 회원으로 본다). 이 모듈은 등록·로그인 화면용이다.

export const MFA_ISSUER = "온기로";

export function hasTotpEnrolled(user: User): boolean {
  return multiFactor(user).enrolledFactors.some(
    (f) => f.factorId === TotpMultiFactorGenerator.FACTOR_ID,
  );
}

// 지금 로그인이 2단계 인증을 거쳤는지 (토큰 firebase.sign_in_second_factor).
// 로컬 에뮬레이터 시드 계정만 예외(devMfaBypass) — 보안 규칙과 같은 예외.
export async function isMfaSession(user: User, forceRefresh = false) {
  const token = await user.getIdTokenResult(forceRefresh);
  if (token.signInSecondFactor === TotpMultiFactorGenerator.FACTOR_ID)
    return true;
  return (
    USE_EMULATORS &&
    token.signInProvider === "password" &&
    token.claims["devMfaBypass"] === true
  );
}

export interface TotpEnrollment {
  secret: TotpSecret;
  // 인증 앱이 읽는 otpauth:// 주소 (QR 코드로 그리고, 휴대폰에서는 눌러서 연다)
  otpauthUrl: string;
  // QR을 못 찍을 때 직접 입력하는 키
  secretKey: string;
}

// 등록 1단계: 서버에서 이메일 인증 표시를 맞춘 뒤 비밀 키를 만든다
export async function startTotpEnrollment(user: User): Promise<TotpEnrollment> {
  const prepare = httpsCallable<void, { ok: boolean; changed: boolean }>(
    functions,
    "prepareStaffMfa",
  );
  const { data } = await prepare();
  if (data.changed) {
    // emailVerified가 바뀌었으면 새 토큰을 받아야 등록 요청이 통과한다
    await user.reload();
    await user.getIdToken(true);
  }
  const session = await multiFactor(user).getSession();
  const secret = await TotpMultiFactorGenerator.generateSecret(session);
  const account = user.email ?? user.displayName ?? user.uid;
  return {
    secret,
    otpauthUrl: secret.generateQrCodeUrl(account, MFA_ISSUER),
    secretKey: secret.secretKey,
  };
}

// 등록 2단계: 인증 앱의 6자리 숫자로 확인하고 등록한다
export async function finishTotpEnrollment(
  user: User,
  secret: TotpSecret,
  code: string,
) {
  const assertion = TotpMultiFactorGenerator.assertionForEnrollment(
    secret,
    code,
  );
  await multiFactor(user).enroll(assertion, "인증 앱");
  // 등록 뒤 이 로그인이 2단계 인증으로 인정되는지 (아니면 다시 로그인해야 한다)
  return isMfaSession(user, true);
}

// 로그인: 2단계 인증을 등록한 계정은 카카오 로그인 뒤 이 오류가 난다
export function totpResolverFrom(e: unknown): MultiFactorResolver | null {
  if (
    !(e instanceof FirebaseError) ||
    e.code !== "auth/multi-factor-auth-required"
  )
    return null;
  const resolver = getMultiFactorResolver(auth, e as MultiFactorError);
  return resolver.hints.some(
    (h) => h.factorId === TotpMultiFactorGenerator.FACTOR_ID,
  )
    ? resolver
    : null;
}

export function resolveTotpSignIn(
  resolver: MultiFactorResolver,
  code: string,
): Promise<UserCredential> {
  const hint = resolver.hints.find(
    (h) => h.factorId === TotpMultiFactorGenerator.FACTOR_ID,
  )!;
  return resolver.resolveSignIn(
    TotpMultiFactorGenerator.assertionForSignIn(hint.uid, code),
  );
}

// 6자리 숫자만 남긴다 (붙여넣기·띄어쓰기 허용)
export function normalizeTotpCode(input: string): string {
  return input.replace(/\D/g, "").slice(0, 6);
}

// 화면에 보일 오류 문구
export function mfaErrorMessage(e: unknown): string {
  const code = e instanceof FirebaseError ? e.code : "";
  switch (code) {
    case "auth/invalid-verification-code":
      return "숫자가 맞지 않습니다. 인증 앱에 지금 보이는 6자리를 다시 넣어 주세요.";
    case "auth/totp-challenge-timeout":
    case "auth/code-expired":
      return "시간이 지났습니다. 처음부터 다시 해 주세요.";
    case "auth/requires-recent-login":
      return "로그인한 지 오래되어 등록할 수 없습니다. 로그아웃 후 다시 로그인해 주세요.";
    case "auth/unverified-email":
      return "이메일 인증이 확인되지 않았습니다. 로그아웃 후 다시 로그인해 주세요.";
    case "auth/operation-not-allowed":
      return "2단계 인증(인증 앱)이 아직 켜져 있지 않습니다. 관리자(PM)에게 알려 주세요.";
    case "functions/failed-precondition":
    case "functions/permission-denied":
      return (e as FirebaseError).message;
    default:
      return e instanceof FirebaseError ? `${e.code}: ${e.message}` : String(e);
  }
}
