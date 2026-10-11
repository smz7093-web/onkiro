import {
  getAdditionalUserInfo,
  getRedirectResult,
  OAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type UserCredential,
} from "firebase/auth";
import { auth } from "./client";
import { usesSameDomainAuth } from "./config";

// Firebase 콘솔에 OpenID Connect 공급자로 등록한 카카오 (task.md 2.1).
export const KAKAO_PROVIDER_ID = "oidc.kakao";

function kakaoProvider() {
  const provider = new OAuthProvider(KAKAO_PROVIDER_ID);
  // 카카오는 요청한 동의항목만 묻는다. 닉네임은 필수, 이메일은 선택 동의 (카카오 콘솔 설정과 맞춘다).
  provider.addScope("profile_nickname");
  provider.addScope("account_email");
  return provider;
}

function fromCredential(result: UserCredential) {
  // 카카오 ID 토큰은 이름을 name이 아니라 nickname 클레임에 담아 보내므로 직접 꺼낸다.
  const nickname = getAdditionalUserInfo(result)?.profile?.["nickname"];
  return {
    user: result.user,
    nickname: typeof nickname === "string" ? nickname : null,
  };
}

// 배포 도메인: 같은 도메인 리다이렉트(휴대폰 브라우저에서도 동작). 페이지를 떠나므로 null을 돌려준다.
// 로컬 개발: 팝업.
export async function signInWithKakao() {
  if (usesSameDomainAuth()) {
    await signInWithRedirect(auth, kakaoProvider());
    return null;
  }
  return fromCredential(await signInWithPopup(auth, kakaoProvider()));
}

// 리다이렉트 로그인에서 돌아왔을 때 결과(닉네임)를 받는다. 돌아온 게 아니면 null.
export async function completeKakaoRedirect() {
  const result = await getRedirectResult(auth);
  return result ? fromCredential(result) : null;
}

export function signOutUser() {
  return signOut(auth);
}
