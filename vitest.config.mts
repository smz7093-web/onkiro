import { defineConfig } from "vitest/config";

// 저장소 루트 테스트는 보안 규칙 테스트만 돌린다 (web/, functions/는 각자 테스트한다).
// 에뮬레이터가 필요하므로 `npm run test:rules`로 실행한다 (Java 21 필요).
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    testTimeout: 20000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
