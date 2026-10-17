// 로컬 에뮬레이터에 붙는 개발 서버 (10/17). 먼저 루트에서 `npm run emulators:app`, `npm run seed:emulator`.
import { spawn } from "node:child_process";

const child = spawn("npx", ["next", "dev", "-p", "3001"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, NEXT_PUBLIC_EMULATORS: "1" },
});
child.on("exit", (code) => process.exit(code ?? 0));
