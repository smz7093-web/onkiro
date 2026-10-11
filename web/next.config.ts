import type { NextConfig } from "next";

// Firebase 로그인 핸들러가 있는 기본 도메인 (task.md 2.1)
const FIREBASE_AUTH_ORIGIN = "https://onkiro-2fe12.firebaseapp.com";

// 저장소 루트에도 package-lock.json(Firebase CLI용)이 있어 Next.js가 루트를 작업 공간으로 잘못 고른다.
// 그러면 App Hosting 빌드의 standalone 출력이 .next/standalone/web/ 아래로 들어가 배포가 실패한다.
// web 폴더를 앱 루트로 고정한다.
const nextConfig: NextConfig = {
  turbopack: { root: __dirname },
  outputFileTracingRoot: __dirname,
  // 리다이렉트 로그인을 앱과 같은 도메인에서 처리한다 (서드파티 쿠키 차단 대응, task.md 2.1).
  // 앱 도메인의 /__/auth/*, /__/firebase/*를 Firebase 기본 도메인으로 넘긴다.
  async rewrites() {
    return [
      {
        source: "/__/auth/:path*",
        destination: `${FIREBASE_AUTH_ORIGIN}/__/auth/:path*`,
      },
      {
        source: "/__/firebase/:path*",
        destination: `${FIREBASE_AUTH_ORIGIN}/__/firebase/:path*`,
      },
    ];
  },
};

export default nextConfig;
