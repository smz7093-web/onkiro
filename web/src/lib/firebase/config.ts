// Firebase 웹 앱 설정 (프로젝트 onkiro-2fe12, 앱 onkiro-web).
// 브라우저에 그대로 노출되는 공개 값이다. 데이터 접근은 보안 규칙이 막는다.

// /__/auth 프록시(next.config.ts)가 있는 배포 도메인. 여기서는 로그인을 같은 도메인의 리다이렉트로 처리한다.
// 도메인을 추가하면 카카오 디벨로퍼스 Redirect URI에 https://{도메인}/__/auth/handler도 등록하고,
// Firebase Authentication 승인된 도메인에도 넣는다.
export const PROXIED_AUTH_HOSTS = [
  "onkiro-web--onkiro-2fe12.asia-east1.hosted.app",
  // 10/22 커스텀 도메인 연결 (가비아 DNS, App Hosting)
  "onkiro.kr",
  "www.onkiro.kr",
];

const DEFAULT_AUTH_DOMAIN = "onkiro-2fe12.firebaseapp.com";

// 로컬 개발(localhost)은 기본 도메인 + 팝업 로그인을 쓴다
export function usesSameDomainAuth() {
  return (
    typeof window !== "undefined" &&
    PROXIED_AUTH_HOSTS.includes(window.location.host)
  );
}

export const firebaseConfig = {
  apiKey: "AIzaSyCiu9w8mvkKiTSKPa7NxDlBqLy1ofjjeZg",
  authDomain: usesSameDomainAuth() ? window.location.host : DEFAULT_AUTH_DOMAIN,
  projectId: "onkiro-2fe12",
  storageBucket: "onkiro-2fe12.firebasestorage.app",
  messagingSenderId: "346362528380",
  appId: "1:346362528380:web:d475a0534458d03196bff9",
  measurementId: "G-FFBXBK1R4W",
};
