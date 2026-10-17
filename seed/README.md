# seed

기준값 초기 버전과 시연용 데이터를 둔다 (task.md 4.6, 5.4).

- `price-v2026.10-1.json` — 단가 DB 초기 버전 (Phase 5)
- `assumption-v0.3.json` — 가정값 초기 버전 (Phase 5)
- `demo-fixtures.json` — 시연용 대표 주소 2곳의 외부 API 조회 결과 (Phase 4)

## 로컬 에뮬레이터 시드 (10/17)

`emulator.seed.test.ts` — 시연 계정 2개(pm@onkiro.test 관리자, member@onkiro.test 회원, 비밀번호 onkiro-demo), 적용 중 기준값, 숙소 onkiro-1을 에뮬레이터에 넣는다.
순서: 루트 `npm run emulators:app` → `npm run seed:emulator` → `web`에서 `npm run dev:emu` (http://localhost:3001). 실제 Firebase에는 접속하지 않는다.
