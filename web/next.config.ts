import type { NextConfig } from "next";

// 저장소 루트에도 package-lock.json(Firebase CLI용)이 있어 Next.js가 루트를 작업 공간으로 잘못 고른다.
// 그러면 App Hosting 빌드의 standalone 출력이 .next/standalone/web/ 아래로 들어가 배포가 실패한다.
// web 폴더를 앱 루트로 고정한다.
const nextConfig: NextConfig = {
  turbopack: { root: __dirname },
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
