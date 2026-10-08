import {
  getAdditionalUserInfo,
  OAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { auth } from "./client";

// Firebase 콘솔에 OpenID Connect 공급자로 등록한 카카오 (task.md 2.1).
export const KAKAO_PROVIDER_ID = "oidc.kakao";

export async function signInWithKakao() {
  const provider = new OAuthProvider(KAKAO_PROVIDER_ID);
  // 카카오는 요청한 동의항목만 묻는다. 닉네임은 필수, 이메일은 선택 동의 (카카오 콘솔 설정과 맞춘다).
  provider.addScope("profile_nickname");
  provider.addScope("account_email");
  // 앱 주소와 authDomain이 달라 리다이렉트는 서드파티 쿠키 차단에 걸리기 쉽다.
  // 배포 주소에서 /__/auth 프록시를 두기 전까지는 팝업을 쓴다.
  const result = await signInWithPopup(auth, provider);
  // 카카오 ID 토큰은 이름을 name이 아니라 nickname 클레임에 담아 보내므로 직접 꺼낸다.
  const nickname = getAdditionalUserInfo(result)?.profile?.["nickname"];
  return {
    user: result.user,
    nickname: typeof nickname === "string" ? nickname : null,
  };
}

export function signOutUser() {
  return signOut(auth);
}
