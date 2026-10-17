import { defineConfig } from "vitest/config";

// 로컬 에뮬레이터에 시연 계정·기준값을 넣는다 (`npm run seed:emulator`, 에뮬레이터를 먼저 켠다).
export default defineConfig({
  test: {
    include: ["seed/**/*.seed.test.ts"],
    environment: "node",
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
