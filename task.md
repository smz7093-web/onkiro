# 온기로(ONKIRO) MVP 작업 목록

- 기준 문서: [prd.md](./prd.md) (공유 문서 rev 130 사본, 10/19 동기화)
- 목표: 2026-10-30(금) 개발 완료 → 11-02(월) 팀 리허설 → **11-03(화) 시연**. 이후 베타(2027 Q1)
- 표기: `[담당]`이 없는 작업은 PM(개발) 담당. 팀원 개발 모듈은 `[담당·개발]`로 적는다(prd.md 3.3절). **10/15부터 `[담당·개발]` 모듈도 PM이 개발하고, 담당 팀원은 기준값·콘텐츠만 준다.** `D#`은 팀원 산출물(prd.md 3.2절). 괄호 안 날짜는 마감
- 갱신 규칙: 작업을 끝내면 아래 목록의 체크박스를 체크하고, 상세 섹션의 "진행 메모"에 결과·결정·남은 문제를 한두 줄 남긴다

---

## 진행 현황 (2026-10-15 기준)

**10/10 업무분장 조정**: 주연은 행정 → **화면 UI 담당**. 팀원 개발 모듈: 원일 5.7·9.7, 주연 6.7·9.4·9.5, 해순 9.3(1.6). 석원 3.7은 10/11 **코딩 → 관리자 화면 판정표 입력(B안)**으로 바꿨다. 주연의 행정 업무는 D1 → PM, D7·D11·상담 접수·지점 실적 → 원일, D8 → PM 초안·원일 검토. **10/19 AI 가상 이미지 대상 4가지**: 전체 외관(정면)·대표 방·욕실·주방 탭(사진 있는 대상만), 대상별 사진 고르기·'N장 중 K번째' 표시, 결과는 대상·등급·사진별 저장(프롬프트 r2). 위험 대비: 실내는 벽·창·문 위치와 방 크기 유지·개인 물건 제거·거울 속 사람 금지 지시, 욕실·주방은 "공사비는 등급과 별개(상태로 계산)" 안내, 실내 사진 개인정보 주의 문구. 하루 AI 30회 한도 안(진단 하나 최대 12장). **10/19 사진 부위 추가**: 선택 부위 '대표 방'·'외부 조경'(필수 8 + 선택 2). 선택 부위는 견적 범위 가산·'현장 확인 필요'에서 뺀다(`REQUIRED_PHOTO_PARTS`). Firestore 규칙(사진 기록 part)·AI 사진 분석 부위 이름에도 추가(10/19 배포). **10/19 팀원 결정 확정**: 팀 회의에서 `팀원결정권장안.md` 전 항목 확정 → 코드 반영(계산식 **v1.2**: 공기 병행 묶음·석면 슬레이트 처리비, 철거 자동 포함, 외부·조경 선택, 체크리스트 11문항('지붕 붕괴'), 확정 단가표·판정표·가정값 `RECOMMENDED_*`, 검증 사례 기준값 = 확정안(3,300만/3,700만/3,100~4,300만/25일, 기본안 월 320만·차감 후 140만·회수 26개월(가동률 10/19 PM 조정 50%·35%·65%, 1호점 테스트 60~70%)), 상담 단계 규칙 D13, AI 선택 동의 D8, 글꼴·보조색). **PM이 할 일**: ① ~~규칙·AI 함수 배포~~(10/19 완료) ② 단가 DB 초안 '확정안 전체 불러오기'→저장→적용 ③ 가정값 새 초안 '확정안 불러오기'→저장→적용 ④ 인허가 항목·촬영 가이드 저장 한 번 ⑤ 2호점 등록 ⑥ D8 문서에 사진 보관 1년/3년·AI 국외 이전 반영. **10/19 UX 기준·관리자 UI**: PM 자료(Laws of UX 30가지)를 `UX기준.md` 점검표로 정리(30개 + 0번 레이아웃 이동·안정성, 실무 점검 7개). 관리자 화면 전체를 공통 UI로: 버튼·색을 공통 토큰으로, 머리말 로고(사이트 홈)+관리자, 메뉴 4묶음(운영·기준값·콘텐츠·계정)·현재 메뉴 강조, 저장 바(상태 문구 고정 줄, 저장=주요 버튼 하나, 적용은 보조, 삭제는 오른쪽 끝), 숫자 칸 쉼표·단위·'만' 입력 허용(`lib/parse-number.ts`), 관리자 첫 화면 '시연 전 준비 현황'(완료/할 일·진행률, `lib/admin/todo.ts`), 리포트 버튼 공통화. **남은 일**: 에뮬레이터로 관리자 화면 캡처 확인. **10/17 팀원 결정 권장안**: `팀원결정권장안.md`에 석원(D4·D5: 빈 공정 3개 단가, 욕실·주방 단가, 판정표 전체, 석면 슬레이트, 공기 병행), 원일(D6 가동률 60%→40% 권장, 위탁 모델과 농어촌민박 거주 요건 충돌, D7, D13, D8 핵심 3개), 해순(D9, D3, D12), 주연(글꼴·어두운 화면·색) 권장안. D7·D9 문구만 코드 기본값에 반영, D4·D5·D6·D13 숫자·규칙은 OK 받은 뒤 반영. **10/15 D7·D9 관리 화면**: 원일·해순이 `/admin/permits`·`/admin/photo-guides`에서 직접 입력. **10/15 실제 운영**: 업무분장(팀원 개발 모듈)은 문서상 그대로 두되, **개발은 PM이 모두 직접 한다**. 팀원은 분야별 기준값·콘텐츠(D#)만 맡는다. 공유 PRD rev 87. 팀원별 안내 메시지는 `팀원작업내용.md`(10/11 작성, 발송은 PM).

**끝난 것** (검토 URL https://onkiro-web--onkiro-2fe12.asia-east1.hosted.app 에서 PM 확인)
- 기반: 저장소·품질 도구, Firebase(서울), App Hosting(asia-east1, `main` 푸시 시 자동 배포)
- 인증·권한: 2.1 카카오 로그인(검토 도메인은 같은 도메인 리다이렉트, 휴대폰 확인) / 2.2 동의 / 2.3 권한 / 2.4 규칙(테스트 37개 통과) / 2.5 회원·권한 화면(해순 권한 부여)
- 계산·기준값: 3.1~3.4 계산 엔진 / 5.1~5.4 기준값 관리 / 3.7 판정표 구조(단가 DB 버전에 `checklistRules`, 관리자 편집기, 기본 판정표로 위험 신호 2개 동작)
- 진단·결과: 6.1~6.5 진단 입력(사진 GPS 제거 확인) / 7.1~7.5 결과 화면·스냅샷 / 10/12 진단 삭제(완료 전 draft만, 사진·빈집 문서 함께 삭제 — PRD의 '삭제 버튼 없음'에서 바뀜, PRD 반영 필요)
- AI(7.7, 10/14): 견적 화면에 실내 마감 하·중·상(=모듈 A/B/C) 견적 3개 비교, 'AI 등급 설명·추천'(자재 예시·추천 등급, 금액은 단가 DB 그대로). 체크리스트에 'AI 사진 분석'(누수·균열·기울어짐·욕실·주방 답 제안, 적용은 회원이). 함수 `explainGrades`·`analyzeDiagnosisPhotos` 배포, 결과는 `assessments/{id}/ai/{kind}`에 입력 지문으로 저장, 회원당 하루 30회. 10/15 키 저장·실제 호출 확인(최신 모델은 도구 강제 tool_choice:tool을 거부 → auto + 시스템 지시). D8에 국외 이전(Anthropic, 미국·사진) 추가 필요
- AI 가상 이미지(7.8, 10/15): 견적 화면 등급 카드 아래 '리모델링 후 모습 미리보기'(외관 정면 사진이 있을 때만). 함수 `renderRemodel`이 Vertex AI(키 없음, 함수 서비스 계정, Vertex AI API 10/15 사용 설정)로 그려 Storage `users/{주인}/assessments/{id}/renders/`에 저장, 같은 사진·등급·프롬프트 버전이면 재사용, 하루 한도는 AI 공통 30회. 1장 약 9초. 중·상급은 지붕 모양을 바꿔 그리기도 해 'AI 가상 이미지·실제와 다를 수 있음' 표시 필수. 시연 전 대표 주소 2곳 미리 생성 권장
- 조회 항목 확장(10/14): 대장 지상 층수·주용도, 브이월드 도로 접면·지형·토지 이용. 층수는 지붕 면적(계산식 v1.1: 연면적 ÷ 층수 × 1.3), 주용도·도로 접면은 인허가 간이 확인 신호(주택 아님, 맹지·차량 통행 불가), 나머지는 확인 화면 참고와 AI 설명 근거. 캐시 이름을 building-v2·land-v2로 바꿔 이전 캐시를 쓰지 않음. 기존 진단은 이미 조회한 주소라 새 항목이 비어 있음(새 진단부터)
- AI 정리(10/15 검토 후): 실패한 AI 호출은 하루 사용 수에서 되돌림, 하루 기준을 한국 날짜로. 진단이 지워지면 함수 `cleanupAssessmentAi`가 `ai` 하위 문서와 Storage `renders/`를 지움(회원 화면의 삭제로는 못 지우던 것). 10/15 함수 4개 배포 완료. 남은 문제: 진단 사진 동의 문구가 "운영팀 검수에만"이라 Anthropic·Google 전송과 맞지 않음 → D8(원일)에서 문구 결정 후 약관 버전 올림. 팀원 확인 요청은 `팀원작업내용.md` 10/15 추가 안내
- 화면: 10/12 앱을 밝은 화면으로 고정(다크 모드 PC에서 판정표 글씨가 안 보이던 문제, 어두운 색은 6.7에서)
- 리포트·상담: 8.1 A4 리포트 / 8.2 마이페이지 / 9.1 상담 신청 / 9.2 상담 관리 칸반·이력·전화 접수
- 숙소: 9.3 PM 몫(관리 화면 `/admin/branches`, 사진 업로드, 쓰기 규칙, 예약 클릭 기록 함수). 1호점 `onkiro-1` 등록(사진 6장) — 화면 표시는 해순 작업 대기
- 외부 API: 4.1~4.6 코드·테스트 완료. 10/12 키 3개 저장(`DATA_GO_KR_KEY`·`JUSO_API_KEY`·`KAKAO_REST_API_KEY`) → 건축물대장·TourAPI·도로명주소·카카오 실제 응답 확인, 함수 `searchAddress`·`lookupProperty` 배포. 10/14 브이월드 키 저장·실제 응답 확인(`domain`은 https:// 없이 호스트만, 2013년부터 오래된 순이라 100건 조회 후 최신 연도·갱신분 사용, 토지면적으로 대지면적 보완) → 외부 API 4개 모두 동작
- 문서: 8.3 D8 초안(https://claude.ai/code/artifact/a76a3595-e6f0-4856-a0d5-260900a38474, 원일 검토 대기) / 1.6 팀원 모듈 뼈대·CONTRIBUTING.md / 팀원작업내용.md
- 테스트: 웹 130개, 함수 69개, 보안 규칙 60개(Firestore·Storage) 통과 (10/19)

**10/15 마감 요약**: 리뷰 후 AI 사용 수 되돌림·진단 삭제 시 AI 결과 정리(함수 4개 배포), 6.7 공통 UI, 9.4 홈(공식 로고·파비콘, PM 사진 onkiro1·2, 2호점 Gemini 이미지 + 'AI' 표시), 9.3 숙소 상세(휴대폰은 요금·예약이 제목 아래), D7·D9 관리 화면(`/admin/permits`·`/admin/photo-guides`, 규칙 배포), 관리 메뉴에 D 번호 표시. 팀원작업내용.md는 개발 요청 빼고 기준값만, D7·D9는 관리 화면 입력 안내로. PM 파일 폴더 `C:/Users/ADMIN/Work_for_AI`(설정 등록).

**다음에 할 일 (권장 순서)**
1. PM: 팀원작업내용.md 날짜 채워 발송(D4·D5·D7·D9 마감 지남), `/admin/branches` 1호점에 예약 링크·사진 onkiro1~5 추가, D7·D9 관리 화면 저장 1회 확인
2. 9.5 휴대폰 화면 점검(진단 6단계·결과·리포트·상담·마이페이지·관리, 로그인 화면은 에뮬레이터 계정으로) → 7.6 응답 속도 측정 → 10.2 시연 시나리오 대본 초안
3. 관리자·리포트 화면에 공통 UI 적용(지금 예전 모양)
4. 팀원 산출물 반영: D4·D5(단가 DB 초안 → PM 적용) → 5.6 최종 전환, D6 → 5.7 수익 검증 테스트, D13 → 9.7 상담 규칙, D8 → 동의 문구(해외 AI 전송 포함)·약관 버전, 주연 디자인 기준 → 글꼴·색, D12 → 2호점 등록
5. 공유 PRD에 진단 삭제 정책 반영, Storage 규칙 테스트(renders 경로 포함)

**사용자가 해야 할 일 (대기 중)**
- [x] App Hosting 백엔드 생성 (10/10)
- [x] 검토 URL 카카오 로그인 (10/10), 휴대폰 리다이렉트 로그인 (10/11), 카카오 Redirect URI에 검토 도메인 추가 (10/11)
- [x] Storage 서비스 계정에 'Firebase Rules Firestore Service Agent' 역할 부여 (10/11)
- [x] Java(JDK 21) 설치 (10/11)
- [ ] `팀원작업내용.md` 날짜 채워 팀원 4명에게 발송 (10/15 추가 안내 포함)
- [x] AI 함수 4개 배포 (10/15)
- [x] 석원·원일·주연 첫 로그인 → `/admin/users`에서 권장 설정 적용 (해순은 10/10 완료) — 완료(PM 확인, 10/15)
- [x] 팀원 GitHub 초대(쓰기 권한) + `main` 브랜치 보호(PR 필수, 비공개 무료 저장소면 규칙으로만 운영) → 팀원 개발 시작 조건 — 완료(PM 확인, 10/15)
- [x] D1 API 키 3개 저장 (10/12)
- [x] 브이월드 키 저장 (10/14)
- [x] Claude API 키 저장 (10/15) — 등급 설명(Sonnet 8초)·사진 분석(Opus 20초, 사진 7장) 실제 호출 확인, 함수 재배포
- [x] 검토 URL에서 실제 주소로 진단 → 주소 검색·대장 자동 채움 확인 (10/12)
- [x] 시연 대표 주소 2곳 (10/13, 사진은 추후 보강)
- 담당자별 WBS: https://claude.ai/code/artifact/29826f75-b846-4650-8d83-d39c87b521c6 (10/13)
- [ ] 예산 알림(월 5만 원) 설정 여부 확인

**팀원 산출물 대기**: D2·D3·D4(석원·해순, 10/10 지남 — D4는 관리자 화면 판정표로 입력) · D5(석원, 10/14) · D7(원일, 10/14) · D9(해순, 10/14) · D6·D13(원일, 10/17) · D8 검토(원일, 10/21) · D12(해순, 10/21)

**환경·작업 메모**
- Firebase 프로젝트 ID `onkiro-2fe12`(표시 이름 onkiro), 리전 asia-northeast3. 함수: `ping`, `syncUserClaims`, `setUserPermissions`, `activateVersion`, `updateConsultation`, `createProxyConsultation`, `searchAddress`, `lookupProperty`, `explainGrades`, `analyzeDiagnosisPhotos`, `renderRemodel`, `cleanupAssessmentAi`(진단 삭제 시 AI 결과 정리), `deleteAssessmentAdmin`(관리자 진단 삭제, 10/19). 함수 배포가 'Timeout after 10000'으로 실패하면 `FUNCTIONS_DISCOVERY_TIMEOUT=60`을 붙여 다시 배포.
- 로컬 실행: `cd web && npx next dev -p 3000` → `/login`(로그인·권한 확인), `/me`(마이페이지), `/consult`(상담 신청), `/admin`(관리자), `/admin/consults`(상담 관리), `/admin/users`(회원·권한), `/admin/branches`(숙소 콘텐츠), `/ui`(UI 견본, 시연 전 삭제), `/stay/sample-1`(숙소 샘플), `/diagnose`(진단 입력 흐름).
- 검사: `web`에서 `npm run lint`·`npm run typecheck`·`npm test`(96개 + todo 3개), `functions`에서 `npm test`(69개)·`npm run build`. 배포: 루트에서 `npx firebase deploy --only firestore:rules|functions|storage`.
- Next.js 16: 코드 작성 전 `web/node_modules/next/dist/docs/` 확인(`searchParams`·`params`는 Promise, `PageProps<"/경로">` 전역 타입). 새 라우트 추가 후 타입 검사 전에 `npx next typegen`.
- 규칙 테스트: 루트에서 `npm run test:rules`(Firestore 에뮬레이터 + vitest, Java 21 필요). Java 설치 전에 연 터미널이면 PATH에 `C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot\bin`이 없으니 새 터미널을 연다.
- Firebase SDK는 12 유지(13은 미검토). 규칙 테스트 도구 `@firebase/rules-unit-testing` 5.x가 12에 맞다.
- **로컬 에뮬레이터로 화면 확인·리허설(10/17)**: 루트 `npm run emulators:app`(auth·firestore·storage, 프로젝트 demo-onkiro) → 루트 `npm run seed:emulator`(계정 `pm@onkiro.test`(관리자)·`member@onkiro.test`(회원), 비밀번호 `onkiro-demo`, 동의 완료, 적용 기준값 확정안 v2026.10-2·v0.4(10/19부터), 숙소 onkiro-1) → `web`에서 `npm run dev:emu`(http://localhost:3001, `NEXT_PUBLIC_EMULATORS=1`이면 실제 Firebase에 접속하지 않음). 카카오 대신 브라우저 콘솔에서 `__devSignIn('pm@onkiro.test','onkiro-demo')`로 로그인(에뮬레이터 모드에서만 있음). 함수(주소 검색·대장 조회·AI)는 에뮬레이터에 없어 실패 처리로 동작(주소 직접 입력).
- Windows 스마트 앱 컨트롤을 꺼서 git이 동작한다(10/8). Bash에서 아주 긴 heredoc 명령이 따옴표 해석 오류를 내면 파일 쓰기 도구로 나눠 쓴다.

---

## 작업 목록

- [x] **Phase 1. 프로젝트 기반** (10/6–10/8)
  - [x] 1.1 저장소 구조 만들기 (Next.js + TypeScript, `web/`·`functions/`·`seed/`)
  - [x] 1.2 Firebase 프로젝트 생성 (Blaze, 서울 리전, 예산 알림 월 5만 원) — 예산 알림만 확인 대기
  - [x] 1.3 Firebase 에뮬레이터·App Hosting 미리보기 배포 연결
  - [x] 1.4 코드 품질 도구 설정 (ESLint, Prettier, Vitest)
  - [x] 1.5 D1 공공 API 키 발급 (10/8, 주연 → PM 이관) — 10/12 저장·응답 확인
  - [x] 1.6 팀원 개발 참여 준비 (`CONTRIBUTING.md`, GitHub 권한·브랜치 보호) (10/13)
- [x] **Phase 2. 인증·권한** (10/7–10/10)
  - [x] 2.1 카카오 로그인 연동 (Identity Platform OIDC, 막히면 커스텀 토큰)
  - [x] 2.2 약관·동의 화면과 동의 기록 (COM-02, COM-04)
  - [x] 2.3 역할·권한 모델 (커스텀 클레임, `users` 문서)
  - [x] 2.4 Firestore·Storage 보안 규칙 1차 — 데이터별 규칙 완료, 규칙 테스트 37개(역할별 전체·Storage는 10.1)
  - [x] 2.5 회원·권한 관리 화면, 초기 계정 5개 생성 (ADM-05)
- [ ] **Phase 3. 계산 엔진** (10/8–10/14)
  - [x] 3.1 엔진 타입·입력 구조 정의 (`web/src/lib/engine`)
  - [x] 3.2 견적 엔진 구현 (SIM-08)
  - [x] 3.3 수익 엔진·3안 구현 (SIM-12, SIM-14)
  - [x] 3.4 기준값 테스트 통과 (견적 대표 예시, 수익 검증표)
  - [x] 3.5 `[석원·해순]` D2·D3·D4 공사비·모듈·체크리스트 매핑 (10/10) — 10/19 확정·반영
  - [x] 3.6 `[석원]` D5 단가·상태계수·불확실도 규칙 (10/14) — 10/19 확정·반영
  - [x] 3.7 `[석원]` 체크리스트 판정표 입력 — 관리자 화면 단가 DB (10/17) — 10/19 확정·반영
- [x] **Phase 4. 외부 API 연동** (10/9–10/16)
  - [x] 4.1 Cloud Functions 프록시 공통 구조 (타임아웃·재시도·로그·캐시)
  - [x] 4.2 주소 검색 (SIM-01)
  - [x] 4.3 건축물대장 조회 (SIM-02)
  - [x] 4.4 브이월드 토지정보 조회 (SIM-03)
  - [x] 4.5 TourAPI 주변 관광지·직선거리 (SIM-04 시연판)
  - [x] 4.6 시연용 대표 주소 2곳 조회 결과 저장
- [ ] **Phase 5. 기준값 관리** (10/13–10/17)
  - [x] 5.1 단가 DB 버전 관리 화면 (ADM-01)
  - [x] 5.2 가정값 버전 관리 화면·검증 사례 재계산 (ADM-02)
  - [x] 5.3 적용 버전 수정 금지 보안 규칙
  - [x] 5.4 초기 버전 입력 (단가 v2026.10-1, 가정값 v0.3)
  - [x] 5.5 `[원일]` D6 수익 가정값·3안 편차 확정 (10/17) — 10/19 확정·반영
  - [ ] 5.6 최종 기준값 전환·재검증·승인 (D5·D6 도착 후, 10/19)
  - [x] 5.7 `[원일·개발]` 수익 검증 사례 테스트 (10/21) — 10/19 확정·반영
- [ ] **Phase 6. 진단 입력 흐름** (10/13–10/19)
  - [x] 6.1 진단 단계 표시줄·자동 저장 (진단 6단계 공통)
  - [x] 6.2 주소 입력 화면 (SIM-01)
  - [x] 6.3 자동조회 확인·수정 화면 (SIM-02, 03, 05)
  - [x] 6.4 사진 업로드 (SIM-06, EXIF 제거)
  - [x] 6.5 상태 체크리스트 (SIM-07)
  - [x] 6.6 `[해순]` D9 촬영 가이드, `[원일]` D7 인허가 항목 (10/14) — 10/19 확정·반영
  - [x] 6.7 `[주연·개발]` 공통 UI 컴포넌트 (10/17) — 10/15 PM 개발, 주연 디자인 기준 오면 조정
- [ ] **Phase 7. 결과 화면** (10/16–10/24)
  - [x] 7.1 견적 결과 화면 (SIM-08, 15)
  - [x] 7.2 위험 신호·인허가 간이 확인 (SIM-10, 11) — 10/19 확정·반영
  - [x] 7.3 수익 시뮬레이션·3안 화면 (SIM-12, 13, 14)
  - [x] 7.4 계산 스냅샷 저장 (SIM-20)
  - [x] 7.5 다음 행동 버튼 (SIM-17)
  - [ ] 7.6 응답 성능 확인 (SIM-19)
  - [x] 7.7 실내 마감 등급(하·중·상) 견적·AI 등급 설명·AI 사진 분석 (10/14 추가, Claude API `ANTHROPIC_API_KEY` 저장 후 동작)
  - [x] 7.8 리모델링 후 모습 AI 가상 이미지 (10/15 추가, Vertex AI `gemini-2.5-flash-image`, 외관 정면 사진 → 등급별)
- [ ] **Phase 8. 리포트·마이페이지** (10/22–10/26)
  - [x] 8.1 PDF 리포트 인쇄 화면 (SIM-16)
  - [x] 8.2 마이페이지 (COM-03)
  - [ ] 8.3 D8 약관·사진 정책 (PM 초안, `[원일]` 검토, 10/21)
- [ ] **Phase 9. 상담·스테이·홈** (10/27–10/30)
  - [x] 9.1 상담 신청 (CON-01)
  - [x] 9.2 상담 관리 칸반·알림 (CON-02)
  - [x] 9.3 `[해순·개발]` 숙소 상세·외부 예약 연결 (STY-01, 02) (10/27) — 10/15 PM 개발, 예약 링크·D12 콘텐츠 대기
  - [x] 9.4 `[주연·개발]` 서비스 소개 홈 (COM-01) (10/28) — 10/15 PM 개발, 주연 홈 문구 오면 교체
  - [x] 9.5 `[주연·개발]` 반응형 점검 (COM-05) (10/28) — 10/17 PM 점검·수정, 실제 휴대폰 확인은 주연
  - [ ] 9.6 `[해순]` D12 숙소 콘텐츠, `[원일]` D13 상담 처리 기준
  - [x] 9.7 `[원일·개발]` 상담 상태 전이·담당 배정 규칙 함수 (10/21) — 10/19 확정·반영
- [ ] **Phase 10. 통합 테스트·시연** (10/29–11/3)
  - [ ] 10.1 보안 규칙 역할별 테스트
  - [ ] 10.2 시연 시나리오 3회 연속 통과
  - [ ] 10.3 시연 데이터·계정 준비
  - [ ] 10.4 `[전원]` 팀 리허설 (11/2)
  - [ ] 10.5 `[전원]` 시연 (11/3)
- [ ] **Phase 11. 시연 후·베타 전** (11/4 ~ 베타 오픈일) — 11.2~11.8은 베타 진입 필수, 11.9는 선택
  - [ ] 11.1 베타 오픈일·작업별 마감 확정 (11/10)
  - [ ] 11.2 사진 정책 반영·외부 사진 업로드 개방 (D8 확정 후)
  - [ ] 11.3 관리자 2단계 인증 강제
  - [ ] 11.4 진단 검수 (ADM-03)
  - [ ] 11.5 현장진단 결과·실제 공사비 기록 (CON-03, CON-07)
  - [ ] 11.6 지점 실적 기록 (DAT-01)
  - [ ] 11.7 관광 입지 경로 기준 (SIM-04 완성판)
  - [ ] 11.8 서버 PDF 생성 (SIM-16 완성판)
  - [ ] 11.9 P1 기능 (SIM-18 → CON-04 → DAT-02 → CON-08 → STY-03 → ADM-04 → STY-05)
  - [ ] 11.10 베타 오픈 (홍성군 귀촌건축지원센터·평생학습관 수강생)

---

## 다음 세션을 위한 배경

### 프로젝트 요약

- **무엇**: 빈집 주소·사진·체크리스트로 공정별 공사비와 스테이 운영 수익을 계산하고, 상담으로 연결하는 웹 서비스. 상세 요구사항은 `prd.md`.
- **누가**: 개발 총괄·핵심 개발은 PM. 해순(공간기획)·석원(건축)·원일(부동산개발)은 기준값·콘텐츠·정책·운영을, 주연은 화면 UI를 맡는다. 2026-10-10부터 네 명 모두 전문 분야 개발 모듈을 하나씩 PR로 개발한다(아래 "팀원 개발 모듈").
- **언제**: 4주 개발 후 11/3 시연. 시연 필수 기능은 29개(prd.md 6절 "시연 필수").
- **기술**: Next.js(App Router, TypeScript) + Firebase(Auth+Identity Platform, Firestore, Storage, Cloud Functions 2세대, App Hosting). 리전은 asia-northeast3(서울).

### 저장소 구조 (Phase 1에서 만든다)

```
onkiro/
├─ prd.md, task.md, MVP_기능명세서.md, 시나리오.md ...   기획 문서 (기존)
├─ mockup/                         정적 목업 (화면 ID 참고용, 동작은 PRD 기준)
├─ web/                            Next.js 앱
│  └─ src/
│     ├─ app/
│     │  ├─ (public)/              홈, 숙소, 로그인
│     │  ├─ diagnose/              진단 6단계 + 결과
│     │  ├─ me/                    마이페이지
│     │  ├─ consult/               상담 신청
│     │  └─ admin/                 관리자 화면
│     ├─ lib/
│     │  ├─ engine/                견적·수익 계산 (순수 함수 + 테스트)
│     │  ├─ firebase/              클라이언트 SDK 초기화
│     │  └─ types/                 Firestore 문서 타입
│     └─ components/
├─ functions/                      Cloud Functions (외부 API 프록시, 알림, 스케줄)
├─ seed/                           단가·가정값 초기 버전 JSON, 시연용 조회 결과
├─ firestore.rules, storage.rules, firebase.json
```

### 팀원 개발 모듈 (2026-10-10 결정, prd.md 3.3절)

| 팀원 | 모듈 | 위치 | 작업 | 마감 |
| --- | --- | --- | --- | --- |
| 주연 | 공통 UI 컴포넌트 | `web/src/components/ui/` | 6.7 | 10/17 |
| 주연 | 서비스 소개 홈, 반응형 점검 | `web/src/app/page.tsx`, `web/src/components/home/` | 9.4, 9.5 | 10/28 |
| 석원 | 체크리스트 판정표 입력 (코딩 없음, 관리자 화면 단가 DB) · 선택: 판정 사례 테스트 | 관리자 화면, `web/src/lib/engine/checklist.test.ts` | 3.7 | 10/17 |
| 원일 | 수익 검증 사례 테스트 | `web/src/lib/engine/revenue.cases.test.ts` | 5.7 | 10/21 |
| 원일 | 상담 상태 전이·담당 배정 규칙 함수 | `web/src/lib/consult/status.ts` | 9.7 | 10/21 |
| 해순 | 숙소 상세 화면 | `web/src/app/(public)/stay/` | 9.3 | 10/27 |

- 팀원은 브랜치 → PR, PM이 검토 후 `main`에 합친다. 인증·보안 규칙·데이터 구조·Functions·배포 설정은 PM만 고친다. 상세는 `CONTRIBUTING.md`.
- PM이 먼저 깔아 줄 것: 함수의 입력·출력 타입(9.7), 숙소 데이터 읽기 함수와 타입(9.3), 빈 `components/ui/` 폴더와 목업 색·글꼴 토큰(6.7). 팀원이 막히면 그 자리에서 PM이 이어받는다.

### 꼭 지켜야 할 원칙

1. 견적은 추정치다. 모든 결과·PDF에 면책 문구, 계산 기준일, 적용 버전을 표시한다.
2. 인허가 간이 확인은 "가능"으로 표시하지 않는다. "법적 판정 아님"을 항상 보여준다.
3. 계산 결과는 스냅샷으로 저장하고, 스냅샷과 적용된 기준값 버전은 수정하지 않는다(새 문서만 만든다).
4. 외부 API가 실패해도 사용자가 직접 입력해서 계속 진행할 수 있어야 한다.
5. 기준값과 콘텐츠는 관리자 화면에서 바꿀 수 있게 만든다. 팀원 요청으로 코드를 고치는 일을 줄이기 위해서다.

### 작업 전체에 걸친 규칙

task 검토(task검토.md)에서 정한 규칙으로, prd.md 6.7절(공통 동작 규칙)·4절(권한표)에도 반영했다. 바꾸려면 PM이 결정하고 여기와 PRD를 함께 고친다.

| 주제 | 규칙 |
| --- | --- |
| 계산 스냅샷 생성 시점 | ① 견적 결과 화면에 처음 도달할 때 ② "저장"·"PDF 받기"·상담 신청 버튼을 누를 때, 현재 입력이 마지막 스냅샷과 다르면 새로 만든다. 슬라이더를 움직이는 동안에는 저장하지 않는다. PDF와 상담은 버튼을 누른 시점의 스냅샷 ID를 참조한다 |
| 진단 상태 | draft(입력 중) → saved(견적 도달) → consult(상담 1건 이상 연결). 상담 단계가 바뀌어도(보류·계약 포함) consult를 유지한다. 위험 신호가 있으면 expertRequired가 다른 상태보다 우선한다 |
| 상담 여러 건 | 한 진단에 상담을 여러 건(유형이 달라도) 신청할 수 있다. 마이페이지에 각각 표시하고, 전환율은 진단 기준 1건으로 센다 |
| 이어하기 | 진단은 Firestore에 계정 기준으로 저장되므로 브라우저·기기를 바꿔도 로그인하면 이어서 진행한다. 진단 삭제 버튼은 MVP에 두지 않고, 삭제는 개인정보 삭제 요청 경로(11.2)로 처리한다 |
| 약관 개정 | 필수 약관 버전이 바뀌면 다음 로그인 때 재동의 화면을 띄운다. 재동의 전에는 새 진단 시작·상담 신청을 막고, 기존 진단·리포트 열람은 허용한다 |
| 사진 없이 진단 | 사진은 "나중에 올리기"로 건너뛸 수 있고, 사진 없이도 견적까지 끝난다(누락 부위만큼 불확실도 가산). 사진 검수용 동의는 PRD대로 가입 시 필수로 받는다 |
| 시연용 저장 데이터 | 외부 API 대신 저장 결과(fixture)를 쓸 때는 출처를 "시연용 저장 데이터"로, 조회 시점을 실제 저장한 날짜로 표시해 실시간 조회와 구분한다 |
| 2단계 인증 | 시연까지는 관리자 2단계 인증을 강제하지 않는다. 이 상태는 시연 기간에만 허용하고, 시연 후 바로 11.3을 진행한다 |

### 화면 ID 대응

목업(`mockup/assets/screens-*.js`)의 화면 ID와 기능 ID 대응은 prd.md 6절 표의 "화면" 열을 따른다. 목업은 레이아웃·문구 참고용이고 버튼 동작은 연결되어 있지 않다.

---

## 상세 작업

### Phase 1. 프로젝트 기반 (10/6–10/8)

#### 1.1 저장소 구조 만들기
- **할 일**: 위 "저장소 구조"대로 폴더를 만든다. `web/`에 Next.js(App Router, TypeScript, Tailwind) 프로젝트를 생성하고, `functions/`에 Cloud Functions TypeScript 프로젝트를 만든다. 저장소 루트에서 `git init`한다.
- **완료 기준**: `web`에서 개발 서버가 뜨고, `functions` 빌드가 통과한다.
- **진행 메모**: 2026-10-06 완료. Next.js 16.3.8(App Router, TS, Tailwind 4, `src/`), React 19.2. `functions/`는 firebase-functions 7 + firebase-admin 14, 런타임 Node 22, 리전 asia-northeast3(`setGlobalOptions`). 연결 확인용 `ping` 함수만 있다. 루트에 `git init -b main`(커밋은 아직 없음). create-next-app이 만든 `web/.git`은 지웠다. **Next.js 16은 API가 바뀌었으니 코드 작성 전 `web/node_modules/next/dist/docs/`를 확인할 것(`web/AGENTS.md`).**

#### 1.2 Firebase 프로젝트 생성
- **할 일**: Firebase 프로젝트를 만들고 Blaze 요금제로 전환한다. Firestore·Functions 리전은 `asia-northeast3`. Google Cloud 콘솔에서 예산 알림(월 5만 원)을 건다. Identity Platform을 활성화한다(2.1에 필요).
- **완료 기준**: 콘솔에서 Firestore(서울), Storage, Functions, App Hosting이 사용 가능 상태.
- **주의**: Firestore 리전은 생성 후 바꿀 수 없다.
- **진행 메모**: 2026-10-06: 저장소 쪽 설정만 완료(`firebase.json`에 Firestore location asia-northeast3, 전체 거부 `firestore.rules`·`storage.rules`). Firebase CLI는 전역 설치 없이 루트 devDependency(`npx firebase`, 15.32.1). **남은 일(사용자 계정 필요)**: `npx firebase login` → 콘솔에서 프로젝트 생성·Blaze 전환·예산 알림·Identity Platform 활성화 → `npx firebase use --add`로 `.firebaserc` 생성.
  - 2026-10-08: 프로젝트 ID는 **`onkiro-2fe12`**(표시 이름 onkiro), `.firebaserc`의 default로 연결. Blaze 전환(Google Cloud 무료 체험판 결제 계정). Firestore `(default)`를 asia-northeast3 Native 모드로 생성하고 규칙·인덱스 배포. Storage 기본 버킷 생성(콘솔) 후 규칙 배포. Cloud Functions `ping`을 asia-northeast3에 배포해 응답 확인, Artifact Registry 정리 정책(1일) 설정. **남은 일**: 예산 알림(월 5만 원) 설정 여부 확인, Identity Platform 활성화(2.1 전에 필요).

#### 1.3 에뮬레이터·미리보기 배포
- **할 일**: `firebase.json`에 Auth·Firestore·Storage·Functions 에뮬레이터를 설정한다. App Hosting 백엔드 1개를 GitHub 저장소의 `main` 브랜치에 연결해, `main`에 푸시하면 자동 배포되는 **팀 공용 검토 URL 1개**를 만든다. 브랜치·PR별 미리보기는 두지 않는다(1인 개발이라 불필요). 팀원 검토는 이 URL로 주 2회 한다.
- **완료 기준**: 로컬 에뮬레이터에서 앱이 동작하고, `main` 푸시 후 검토 URL에서 빈 홈이 열린다. URL을 팀에 공유했다.
- **진행 메모**: 2026-10-06: `firebase.json`에 에뮬레이터(auth 9099, firestore 8080, storage 9199, functions 5001, UI 4000) 설정, `npm run emulators`는 `demo-onkiro` 데모 프로젝트로 실제 프로젝트 없이 실행. `web/apphosting.yaml`(min 0, max 2 인스턴스) 작성. **남은 일**: Java(JDK 21) 설치 후 에뮬레이터 실행 확인, GitHub 저장소 생성·푸시, App Hosting 백엔드 생성(루트 디렉터리 `web`, 브랜치 `main`, 리전은 생성 화면에서 서울 지원 여부 확인).
  - 2026-10-10: App Hosting 백엔드 `onkiro-web`(asia-east1, Node 24) 연결, **검토 URL https://onkiro-web--onkiro-2fe12.asia-east1.hosted.app**, `main` 푸시 시 자동 출시(약 3분). 첫 출시는 어댑터 빌드 실패: 저장소 루트의 `package-lock.json` 때문에 Next.js가 루트를 작업 공간으로 잡아 standalone 출력이 `web/` 아래로 중첩됨 → `next.config.ts`에 `turbopack.root`·`outputFileTracingRoot`를 `web`으로 고정해 해결. Firebase Auth 승인된 도메인에 검토 도메인 추가(사용자). 어댑터(`@apphosting/adapter-nextjs`)는 Windows에서 실행되지 않아 로컬 재현은 일반 `next build`로만 한다. **남은 일**: 에뮬레이터 확인(Java).

#### 1.4 코드 품질 도구
- **할 일**: ESLint·Prettier 설정, Vitest 설치(엔진 테스트용), `npm test` 스크립트.
- **완료 기준**: `npm test`가 빈 테스트로 통과.
- **진행 메모**: 2026-10-06 완료. `web/`: Vitest 5 + jsdom + Testing Library, Prettier 3(기본 설정) + `eslint-config-prettier`. 스크립트 `lint`, `typecheck`, `test`(vitest run), `test:watch`, `format`, `format:check`. Vitest 5가 `@types/node` 22 이상을 요구해 24로 올렸다. 첫 테스트 `src/lib/engine/version.test.ts`(FORMULA_VERSION = v1.0). lint·typecheck·test·build 통과, `next start`로 임시 홈(`lang=ko`, 제목 온기로) 응답 확인.

#### 1.5 D1 공공 API 키 발급 (10/8, 주연 → PM 이관)
- **필요한 키**: 도로명주소 검색 API(행정안전부, juso.go.kr), 공공데이터포털 건축물대장정보 서비스, 브이월드 OpenAPI, 한국관광공사 TourAPI, 카카오 디벨로퍼스 앱(카카오 로그인 + 지도/로컬 API).
- **PM 확인**: 발급된 키로 각 API에 테스트 호출해 응답 형식을 확인하고, 키는 Secret Manager에 넣는다(코드·저장소에 넣지 않는다).
- **진행 메모**: 2026-10-10 업무분장 조정으로 PM이 직접 발급한다(마감 지남, Phase 4를 막고 있음). 같은 날 도로명주소·공공데이터포털(건축물대장·TourAPI)·브이월드 신청 완료, 승인 대기(약 1일). 카카오는 기존 앱 REST API 키 사용. 키 저장 이름: `JUSO_API_KEY`, `DATA_GO_KR_KEY`(Decoding 키), `VWORLD_API_KEY`(서비스 URL = 검토 주소), `KAKAO_REST_API_KEY` (`npx firebase functions:secrets:set`).

#### 1.6 팀원 개발 참여 준비 (10/13)
- **할 일**: `CONTRIBUTING.md`(설치, 브랜치·PR 규칙, 검사 명령, 손대지 않는 폴더) 작성. 팀원 4명 GitHub 초대(Write), `main` 브랜치 보호(PR 필수, 직접 푸시는 PM만). 각 모듈의 입력·출력 타입이나 빈 화면을 PM이 먼저 만들어 둔다(아래 3.7, 5.7, 6.7, 9.3, 9.7).
- **완료 기준**: 팀원 1명 이상이 가이드대로 로컬 설치 → `npm test` 통과 → 연습 PR 1건을 올린다.
- **진행 메모**: 2026-10-10 `CONTRIBUTING.md` 작성, 모듈 뼈대 5개 완료(3.7, 5.7, 6.7, 9.3, 9.7 진행 메모). 초대·브랜치 보호는 사용자 작업 대기.

---

### Phase 2. 인증·권한 (10/7–10/10)

#### 2.1 카카오 로그인 연동 (COM-02)
- **방식 ①(우선)**: Identity Platform에서 OIDC 공급자로 카카오 등록 → 클라이언트에서 `OAuthProvider('oidc.kakao')`로 로그인. 카카오 디벨로퍼스에서 OpenID Connect 활성화, Redirect URI 등록 필요.
- **방식 ②(대체)**: 카카오 JS SDK로 액세스 토큰 획득 → Cloud Function이 카카오 사용자 정보 API로 검증 → `createCustomToken` 발급 → `signInWithCustomToken`.
- **완료 기준**: 실제 카카오 계정으로 로그인해 Firebase uid가 생긴다. **1주차 안에 반드시 확인**(prd.md 14절 결정 1).
- **네이버**: 버튼만 "준비 중"으로 비활성 표시.
- **진행 메모**: 2026-10-08 완료(방식 ①). 카카오 기존 '온기로' 앱에서 카카오 로그인·OpenID Connect ON, REST API 키의 리다이렉트 URI `https://onkiro-2fe12.firebaseapp.com/__/auth/handler`, 클라이언트 시크릿 ON, 동의항목 닉네임 필수·이메일 선택. Firebase는 Identity Platform 업그레이드 후 OIDC 공급자 `oidc.kakao`(코드 흐름, 발급자 `https://kauth.kakao.com`) 등록, 웹 앱 `onkiro-web` 등록(설정값은 `web/src/lib/firebase/config.ts`, 공개 값). 코드: `src/lib/firebase/{client,kakao}.ts`, 임시 확인 화면 `/login`. 실제 카카오 계정 로그인 확인. **남은 일**: 지금은 `signInWithPopup`. 앱 주소와 authDomain이 달라 리다이렉트가 서드파티 쿠키 차단에 걸리므로, App Hosting 배포 주소가 생기면 Next.js rewrites로 `/__/auth/*`를 `onkiro-2fe12.firebaseapp.com`으로 프록시하고 authDomain을 배포 도메인으로 바꾼 뒤 모바일은 `signInWithRedirect`로 전환한다(카카오 리다이렉트 URI에 배포 도메인 핸들러도 추가).
  - 2026-10-11: 전환 완료, 휴대폰 브라우저 로그인 확인(PM). `next.config.ts` rewrites로 `/__/auth/*`·`/__/firebase/*`를 firebaseapp.com으로 프록시, `config.ts`의 `PROXIED_AUTH_HOSTS`(검토 도메인)에서는 authDomain=현재 도메인 + `signInWithRedirect`, 돌아오면 `getRedirectResult`로 닉네임 반영. localhost는 기본 도메인+팝업 유지. 카카오 Redirect URI에 `https://onkiro-web--onkiro-2fe12.asia-east1.hosted.app/__/auth/handler` 추가(사용자). `/__/firebase/init.json`은 기본 도메인에서도 404(Firebase Hosting 미사용)이며 로그인에는 필요 없음. 도메인을 바꾸거나 추가하면 세 곳(PROXIED_AUTH_HOSTS, 카카오 Redirect URI, Firebase 승인된 도메인)을 함께 고친다.

#### 2.2 약관·동의 (COM-04)
- **할 일**: 최초 로그인 후 동의 화면. 필수 4개(이용약관, 개인정보 수집·이용, 견적 면책, 진단 사진 검수용 이용) + 선택 1개(사진 모델 개선용). 동의 완료 전에는 진단을 시작할 수 없다.
- **저장**: `users/{uid}/consents/{id}` = {type, version, agreed, agreedAt}. 선택 동의는 나중에 철회 가능.
- **문구**: D8(10/21) 전까지는 임시 문구 + 사진 보관 기간 "정책 확정 예정".
- **약관 개정**: 동의 기록에 약관 버전을 남기고, 현재 필수 약관 버전과 다르면 재동의 화면으로 보낸다. 재동의 전에는 새 진단·상담 신청 불가, 기존 진단 열람 가능("작업 전체에 걸친 규칙" 참고).
- **참고 화면**: 목업 `login`.
- **진행 메모**: 2026-10-08 완료. 동의 항목 정의 `web/src/lib/consent/definitions.ts`(버전 `draft-2026-10-08`, D8 오면 문구 교체 후 버전 올림 → 재동의 자동), 판정 `evaluate.ts`(테스트 4개), 저장 `store.ts`(추가만, 선택 동의 철회 함수 포함), 화면 `/consent`, 진입 보호 `components/require-consent.tsx`(임시 `/diagnose`에 적용). 로그인 시 회원 문서 `users/{uid}`를 트랜잭션으로 한 번만 생성(카카오 닉네임을 name으로). `firestore.rules`에 본인 회원 문서·동의 기록 규칙 추가·배포(권한 필드 자기 수정 불가, 동의 기록 수정·삭제 불가). `next` 경로는 `safeNextPath`로 앱 내부 경로만 허용. 실제 계정으로 로그인 → 동의 → `/diagnose` 진입 확인. 규칙 자동 테스트는 Java 설치 후 10.1에서.

#### 2.3 역할·권한 모델
- **역할**: member / staff / admin. staff는 아래 세부 권한을 조합한다. 시연 후 기능(검수·공사비·실적)의 권한도 지금 모델에 넣어 두고, 화면은 Phase 11에서 만든다.

| 권한 키 | 값 | 허용하는 일 | 쓰는 기능 |
| --- | --- | --- | --- |
| `photoAccess` | all / assigned / none | 진단 사진 보기 (assigned는 `assessments.assigneeUid == uid`일 때만) | SIM-06, ADM-03 |
| `canEditPrices` | bool | 단가 DB draft 생성·수정 | ADM-01 |
| `canEditAssumptions` | bool | 가정값 draft 생성·수정 | ADM-02 |
| `canEditContent` | bool | 숙소·홈 콘텐츠 수정 | STY-01, COM-01 |
| `consultAccess` | all / assigned / none | 상담 목록 보기·상태 변경·메모·대리 입력 (assigned는 `assigneeUid == uid`일 때만) | CON-01·02 |
| `canReviewDiagnosis` | bool | 진단 보정(보정 사유 필수) | ADM-03 |
| `canReviewCosts` | bool | 실제 공사비 검수(approved 처리) | CON-03·07 |
| `canEnterBranchRecords` | bool | 지점 실적 입력·엑셀 가져오기 | DAT-01 |
| `canApproveVersions` | bool | 단가·가정값 draft를 active로 적용 | ADM-01·02 |

- **할 일**: 권한을 Auth 커스텀 클레임과 `users/{uid}` 문서 양쪽에 저장. 클레임 설정은 관리자 전용 Cloud Function(callable)으로.
- **확인 위치**: 같은 권한을 ① Firestore·Storage 보안 규칙(데이터 접근) ② 관리자 화면 메뉴·버튼 노출(화면 접근) 두 곳에서 확인한다. 화면에서 숨기는 것만으로는 막지 않는다.
- **진행 메모**: 2026-10-08 완료. 원본은 `users/{uid}`의 권한 필드, Firestore 트리거 `syncUserClaims`가 커스텀 클레임 `{role, photoAccess, consultAccess, perms[]}`로 옮긴다(같으면 다시 쓰지 않음). admin은 필드와 무관하게 전체 권한, member는 권한 없음, 잘못된 값은 가장 좁은 권한. 관리자 전용 callable `setUserPermissions`(입력 검증, 본인 관리자 해제 금지, `auditLogs` 기록)는 배포만 했고 2.5 화면에서 검증한다. 계산 로직 `functions/src/permissions.ts`(테스트 9개), 웹 `src/lib/permissions.ts`·`auth/use-permissions.ts`(테스트 3개) — 두 파일의 키 이름을 같게 유지할 것. **첫 관리자 지정**: Firebase 콘솔에서 본인 `users` 문서의 role을 admin으로 바꾸면 트리거가 반영(PM 계정 완료, 로그인 화면의 '권한 새로고침'으로 확인). 2세대 함수 첫 배포 때 Eventarc 권한 전파로 트리거 배포가 한 번 실패했다가 2분 뒤 재시도로 성공.

#### 2.4 보안 규칙 1차
- **원칙**: 회원은 자기 진단·상담만 읽고 쓴다. staff는 2.3 권한표대로 접근. 진단 사진은 `photoAccess`가 all이거나, assigned이면서 `assessments.assigneeUid == uid`일 때만 읽기. 상담은 `consultAccess` 기준. 스냅샷과 active 버전 문서는 update 금지.
- **완료 기준**: 에뮬레이터에서 기본 허용/거부 테스트 몇 개 통과(전체 테스트는 10.1).
- **진행 메모**: 2026-10-08 뼈대 완료(체크는 데이터별 규칙이 모두 들어간 뒤). `firestore.rules`에 권한 함수 `role()`, `isAdmin()`, `isStaff()`, `hasPerm(flag)`, `canSeePhotos(assigneeUid)`, `canHandleConsult(assigneeUid)` 추가, 관리자의 회원 문서·동의 기록·`auditLogs` 읽기 허용, 나머지 경로는 계속 거부. `storage.rules`에 `canSeePhotos` 뼈대(모든 경로 거부 유지). 두 규칙 배포 완료. **데이터별 규칙은 해당 작업에서 이 함수로 추가**: 단가·가정값 5.3, 진단·사진 6.x, 스냅샷 7.4, 상담 9.1·9.2, 숙소 9.3. 규칙 테스트 `tests/rules/firestore.rules.test.ts`(13개)와 루트 `npm run test:rules`(에뮬레이터 + vitest)는 작성만 했고 **Java 21 설치 후 실행**해야 한다. 루트 테스트 도구는 `@firebase/rules-unit-testing` 5.x(Firebase SDK 12와 맞춤, SDK 13은 아직 올리지 않음).

#### 2.5 회원·권한 관리 (ADM-05)
- **초기 계정 5개** (prd.md 2·3절 기준, 2.3의 권한 키):

| 계정 | 역할 | photoAccess | consultAccess | true로 둘 권한 |
| --- | --- | --- | --- | --- |
| PM | admin | all | all | 전체 (`canApproveVersions` 포함) |
| 해순 | staff | none | none | `canEditContent` (단가 DB는 조회만) |
| 석원 | staff | all | assigned | `canEditPrices`, `canReviewDiagnosis`, `canReviewCosts` |
| 원일 | staff | assigned | all | `canEditAssumptions`, `canEnterBranchRecords` |
| 주연 | staff | none | none | `canEditContent` (홈 콘텐츠 확인용) |

- 석원은 배정받은 상담만, 원일은 접수 담당이라 전체 상담을 본다(10/10 주연 → 원일 이관). 단가·가정값 적용은 PM만 한다(두 사람 확인 원칙).
- **화면**: 목업 `adm-users`. 계정 목록, 역할·권한 변경. 2단계 인증 강제는 11.3(시연 후).
- **진행 메모**: 2026-10-10 화면 완료, 실제 계정 확인 대기. `/admin/users`(관리자에게만 메뉴 노출): 운영팀/일반 회원/전체 필터, 행별 '변경' → 역할·사진·상담 범위·세부 권한 편집, '팀원 권장 설정 불러오기'(위 표 4명), 본인 역할 변경 잠금, 적용 권한 켤 때 두 사람 확인 원칙 경고. 저장은 `setUserPermissions`(감사 로그 기록) → `syncUserClaims`가 토큰 반영. 코드: `lib/members/{form,store}.ts`(테스트 7개), `components/admin/{member-admin,admin-nav}.tsx`. PM 계정이 관리자로 보이는 것 확인, 검토 URL에서 해순 계정에 권장 설정 적용(10/10). **남은 일**: 석원·원일·주연 첫 로그인 → 권장 설정 적용 → 각자 '권한 새로고침'으로 확인(이때 체크).

---

### Phase 3. 계산 엔진 (10/8–10/14)

#### 3.1 엔진 타입·입력 구조
- **위치**: `web/src/lib/engine/` — React·Firebase를 import하지 않는 순수 TypeScript. 브라우저와 Cloud Functions가 같은 코드를 쓴다.
- **입력**: 진단 데이터(연면적, 욕실·주방 개수, 공정별 상태 판정, 사진 누락 부위 수, 대장 없음 여부, "모름" 응답 수, 모듈 선택) + 단가 버전 데이터 + 가정값 버전 데이터 + 사용자 수익 입력값.
- **출력**: 공정별 비용·작업일, 공정 소계, 예비비, 합계, 범위, 공기, 3안 결과, 사용된 버전 3종(`priceVersion`, `assumptionVersion`, `formulaVersion = "v1.0"`).
- **진행 메모**: 2026-10-08 완료. `web/src/lib/engine/types.ts`(공정 10개, PriceTable·AssumptionSet = Firestore 버전 문서의 data 형태, EstimateInput/Result, RevenueInput 13개/Result), `index.ts`로 묶음. 금액은 원 단위, 계산값은 반올림하지 않음.

#### 3.2 견적 엔진 (SIM-08)
- **규칙**: prd.md 7.1절.
  - 공정별 비용 = 기준수량 × 기본 단가 + 기준수량 × 보수 단가 × 상태계수(양호 0 / 부분 0.4 / 전면 1.0)
  - 지붕 기준수량 = 연면적 × 1.3. 욕실·주방은 개수.
  - 공정 소계 × 지역계수(홍성 1.0) → 합계 = 소계 × 1.10
  - 범위 = 합계 × (1 ± 불확실도). **하한은 100만 원 단위 내림, 상한은 올림.** 불확실도 = 15% + 사진 누락 부위당 5%p + 대장 없음 10%p (+ D5 규칙, "모름" 가산 포함)
  - 공기 = 병행 공정을 반영한 임계경로 합 + 고정일 5일
- **초기 단가(목업 `adm-price-db`, D5로 교체 예정)**:

| 공정 | 기준수량 | 기본 단가 | 보수 단가 | 기본 작업일 | 보수 기준일 |
| --- | --- | --- | --- | --- | --- |
| 철거 | 연면적 | 25,000/㎡ | – | 3 | – |
| 지붕 | 연면적×1.3 | – | 173,600/㎡ | – | 12 |
| 구조 보강 | 연면적 | – | 104,200/㎡ | – | 8 |
| 욕실 | 개수 | – | 2,500,000/개 | – | 6 |
| 주방 | 개수 | – | 2,000,000/개 | – | 5 |
| 내부 리모델링 (모듈 A/B/C) | 연면적 | 165,000 / 208,000 / 236,000 /㎡ | – | 15 | – |
| IoT 패키지 | 1식 | 1,000,000 | – | 1 | – |

- **확인할 문제**: 대표 예시(공정 소계 3,000만 원)에는 철거가 없다. 위 단가대로 철거 기본 공사비를 항상 넣으면 72㎡ × 25,000 = 180만 원이 더해져 3,180만 원이 된다. 철거를 넣는 조건을 석원에게 확인한다(D4·D5). 확인 전까지는 테스트 기준값을 맞추기 위해 철거를 "조건부"로 둔다.
- **병행 공정**: 임계경로 규칙은 D5에서 받는다. 받기 전까지는 대표 예시 공기 40일을 맞추는 임시 규칙을 쓰고 코드에 TODO를 남긴다.
- **진행 메모**: 2026-10-08 완료(임시 규칙). `estimate.ts`의 `calculateEstimate`, 표시용 `roundForDisplay`. 기본 공사는 `baseApplies`(always: 내부 모듈·IoT / optional: 철거 — 입력 `optionalBaseWork`로 선택). 단가 없는 공정에 상태 판정이 있으면 `unpricedProcesses`로 알림. **임시로 둔 것(D4·D5 대기)**: 철거 조건, 공기 = 공정 작업일 단순 합 + 고정일(대표 예시 35 + 5 = 40일과 일치), "모름" 가산 `perUnknownAnswer = 0`. 임시 단가는 `defaults.ts`의 `PRICE_V2026_10_1`(목업 값).

#### 3.3 수익 엔진·3안 (SIM-12, SIM-14)
- **계산식**: prd.md 7.2절. ADR = 평일가×5/7 + 주말가×2/7. 월 판매 박수 = (30 − 판매 불가일) × 가동률. 1박 공헌이익 = ADR×(1+부가매출 비율)×(1 − OTA 경유 비중×수수료율) − 회당 청소비 ÷ 평균 숙박일수. BEP 가동률 = 고정비 ÷ (판매 가능일 × 1박 공헌이익).
- **입력 13개**: 평일가, 주말가, 가동률, OTA 수수료율, 판매 불가일(슬라이더) + OTA 경유 비중, 평균 숙박일수, 회당 청소비, 공과금, 임차료, 보험·유지보수, 부가매출 비율, 기타 초기 투자금(숫자 입력).
- **3안**: 보수 = 기본 −15%p, 낙관 = 기본 +10%p. 가동률만 바꾼다. 기본안 가동률 입력 범위는 25~85%.
- **예외**: 차감 후 추정액 ≤ 0이면 회수 기간 "회수 불가".
- **진행 메모**: 2026-10-08 완료. `revenue.ts`의 `calculateRevenue`, `calculateScenarios`(기본안 가동률 25~85% 밖이면 오류). 입력 범위 검증(비율 0~1, 판매 불가일 0~30, 평균 숙박 1박 이상). 임시 가정값 `defaults.ts`의 `ASSUMPTION_V0_3`.

#### 3.4 기준값 테스트
- **견적 조건**: 72㎡ 목구조·모듈 B, 지붕 부분보수, 구조 부분보수(경미 균열), 욕실 1·주방 1 전면교체, IoT, 철거 제외(3.2 확인 문제), 사진·대장 정상(불확실도 15%).
- **견적 ① 계산값 비교 (원 단위, 정확히 일치)**:

| 항목 | 계산식 | 기대값 (원) |
| --- | --- | --- |
| 지붕 | 72 × 1.3 × 173,600 × 0.4 | 6,499,584 |
| 구조 보강 | 72 × 104,200 × 0.4 | 3,000,960 |
| 내부 리모델링 (모듈 B) | 72 × 208,000 | 14,976,000 |
| 욕실·주방 | 2,500,000 × 1.0 + 2,000,000 × 1.0 | 4,500,000 |
| IoT | 1,000,000 | 1,000,000 |
| 공정 소계 | 합 × 지역계수 1.0 | 29,976,544 |
| 합계 | 소계 × 1.10 | 32,974,198.4 |
| 범위 하한 (계산) | 합계 × 0.85 | 28,028,068.64 |
| 범위 상한 (계산) | 합계 × 1.15 | 37,920,328.16 |

- **견적 ② 화면 표시값 비교**: 공정 소계 3,000만 원, 합계 3,300만 원(100만 원 단위 반올림), 범위 2,800만~3,800만 원(하한은 100만 원 단위 내림, 상한은 올림), 공기 40일.
- 계산값은 반올림하지 않고 스냅샷에 저장하고, 반올림은 화면·PDF에 표시할 때만 한다.
- **수익(총투자금 3,300만, 기본값: 평일 20만·주말 30만, OTA 15%·경유 100%, 청소 5만/회, 1.5박, 공과금 30만·임차료 50만·보험 15만)**:

| 항목 | 보수 45% | 기본 60% | 낙관 70% |
| --- | --- | --- | --- |
| 월 매출 | 약 309만 | 약 411만 | 약 480만 |
| 월 운영비 | 약 186만 | 약 217만 | 약 237만 |
| 차감 후 | 약 122만 | 약 195만 | 약 243만 |
| 회수 | 약 27개월 | 약 17개월 | 약 14개월 |
| BEP | 약 20% | 약 20% | 약 20% |

- 수익 표는 PRD의 근사값이므로 계산값을 만 원 단위로 반올림해 비교하고, BEP는 소수 첫째 자리 반올림 %로 비교한다.
- **완료 기준**: `npm test`에서 견적 ①·② 와 수익 표가 모두 통과. 이 단계의 통과는 **임시 기준값 검증**이며, 최종 승인은 5.6에서 한다.
- **진행 메모**: 2026-10-08 **임시 기준값 검증 통과**(최종 승인은 5.6). `estimate.test.ts` 13개(① 원 단위 계산값 ② 표시값 3,000만/3,300만/2,800~3,800만/40일, 규칙), `revenue.test.ts` 11개(검증표 3안 + BEP 20%, 규칙). 웹 전체 테스트 34개 통과.

#### 3.5 `[석원·해순]` D2·D3·D4 (10/10)
- D2 1호점 실제 공사비 공정별 정리(석원), D3 공정 분류·표준 모듈 A/B/C 구성표(해순, 석원 협의), D4 체크리스트 10문항 → 공정별 판정(양호/부분/전면) 매핑표·위험 신호 기준(석원).
- **받은 뒤 할 일**: D4 매핑표는 석원이 관리자 화면 단가 DB 초안의 판정표에 직접 입력한다(3.7, 10/11 B안).
- **진행 메모**:

#### 3.6 `[석원]` D5 (10/14)
- 공정별 기본·보수 단가, 상태계수, 작업일, 불확실도 가산 규칙("모름" 포함), 병행 공정 규칙.
- **PM이 받은 뒤 할 일**: 5.6 절차대로 전환한다.
- **진행 메모**:

#### 3.7 `[석원]` 체크리스트 판정표 입력 (10/17) — 10/11 B안으로 변경(코딩 → 관리자 화면 입력)
- **방식**: 판정 기준(D4)은 코드가 아니라 **단가 DB 버전의 판정표**(`PriceTable.checklistRules`)에 둔다. 석원이 관리자 화면 **단가 DB → 새 초안 → '체크리스트 판정표 (D4)'**에 한 줄씩 입력하고, PM이 검증 사례 확인 후 적용한다(두 사람 확인). 단가와 같은 버전으로 묶여 "같은 버전이면 같은 결과"(prd.md 7.3)가 지켜진다.
- **한 줄** = 문항 · 답 → 공정 · 판정(양호/부분 보수/전면 교체) · 위험 신호(큰 균열/심한 기울어짐/지붕 붕괴). 한 공정에 여러 줄이 걸리면 가장 나쁜 판정. 공정 없이 위험 신호만 있는 줄도 된다. 화면 아래 '판정표에 없는 답'에서 빠진 답을 바로 추가할 수 있다.
- **기본 판정표**(판정표가 없는 버전에 적용): 욕실·주방(답 = 상태), 위험 신호 2개(금 '손가락 들어갈 정도' → 큰 균열, 기울어짐 '많이' → 심한 기울어짐, task.md 7.2 기준). 나머지 문항은 D4로 채운다.
- **석원 개발 몫(선택)**: 판정표가 확정되면 대표 사례 몇 개를 `checklist.test.ts`에 테스트로 남길 수 있다(필수 아님).
- **완료 기준**: 10문항의 모든 답이 판정표에 있거나 '영향 없음'으로 확인됨, 적용 버전에서 대표 예시(지붕·구조 부분 보수, 욕실·주방 전면 교체)가 나오는 체크리스트 답이 있음.
- **진행 메모**: 2026-10-10 PM 뼈대(코드 방식). 2026-10-11 B안으로 변경: `lib/engine/checklist.ts` `evaluateChecklist(answers, rules)`가 판정표를 적용, `DEFAULT_CHECKLIST_RULES`, `uncoveredAnswers`, 관리 화면 `components/admin/checklist-rules-editor.tsx`, 서버 `activateVersion` 검증에 판정표 형식 검사(테스트 2개). 계산은 `computeEstimate`가 `price.checklistRules ?? 기본값`을 쓴다. 현재 적용 버전 v2026.10-1에는 판정표가 없어 기본 판정표가 쓰인다. **석원 대기**: D4 매핑표 → 새 초안에 입력.

---

### Phase 4. 외부 API 연동 (10/9–10/16)

#### 4.1 프록시 공통 구조
- **할 일**: `functions/src/external/`에 API별 callable 함수. 공통 래퍼: 타임아웃 5초, 재시도 1회, 오류 로그, 결과에 `source`·`fetchedAt` 포함. 같은 PNU 결과는 Firestore 캐시 컬렉션(예: `apiCache/{api}_{pnu}`)에 저장해 재사용.
- **키**: Secret Manager에서 읽는다.
- **진행 메모**: 2026-10-11 코드 완료, **배포는 키 저장 후**(함수가 없는 Secret을 참조하면 배포 실패). `functions/src/external/`: `http.ts` `fetchJson`(5초 타임아웃, 1회 재시도, 로그에서 쿼리·키 제거, JSON 아닌 응답은 parse 오류), `cache.ts`(`apiCache/{api}_{key}`, 서버만 접근, 주소 7일·대장·토지·관광 30일), `lookup.ts`(캐시→외부→시연 데이터, 출처별 실패 분리, 의존성 주입으로 테스트), 함수 `searchAddress`·`lookupProperty`(`index.ts`, `defineSecret` 4개). 테스트: 파서 15개·조회 9개. 배포 명령: `FUNCTIONS_DISCOVERY_TIMEOUT=60 npx firebase deploy --only functions:searchAddress,functions:lookupProperty`.

#### 4.2 주소 검색 (SIM-01)
- 도로명주소 API로 검색어 → 후보(도로명, 지번, PNU 구성 요소, 좌표). PNU = 법정동코드 10자리 + 산 여부 1자리 + 본번 4자리 + 부번 4자리.
- 좌표가 응답에 없으면 카카오 로컬 API로 보완.
- **진행 메모**: 2026-10-11 코드 완료(실제 응답 확인 전). 도로명주소 검색API(`confmKey`, `resultType=json`) → 후보 10개, PNU = `admCd` + (`mtYn`=1이면 2, 아니면 1) + 본번·부번 4자리. 앞 5개는 카카오 로컬(`KakaoAK`)로 좌표 보완(실패해도 후보는 반환). 웹 `lib/diagnosis/address.ts`가 함수를 부르고, 실패·미배포면 직접 입력 안내.

#### 4.3 건축물대장 (SIM-02)
- 공공데이터포털 건축물대장 표제부: 연면적, 대지면적, 주구조, 지붕구조, 사용승인일. 결측 항목은 `missing`으로 반환(화면에서 `결측` 표시). 대장이 아예 없으면 빈 결과 + 플래그.
- **진행 메모**: 2026-10-11 코드 완료(실제 응답 확인 전). 건축HUB `BldRgstHubService/getBrTitleInfo`(PNU → 시군구5·법정동5·대지/산·번4·지4). 주건축물 중 연면적 최대 동, 구조·지붕은 확인 화면 선택지로 맞춤(`normalizeStructure`·`normalizeRoof`), 사용승인일 YYYY-MM-DD, 빈 값은 결측(null), 결과 없음 → `found:false` → 화면이 '대장 없음' 선택을 권함. **엔드포인트·필드명은 키 발급 후 실제 응답으로 확인**(다르면 `parsers.ts`만 고친다).

#### 4.4 브이월드 토지정보 (SIM-03)
- 지목, 용도지역, 개별공시지가(기준 연월).
- **진행 메모**: 2026-10-11 코드 완료(실제 응답 확인 전). 브이월드 NED `getLandCharacteristics`(`key`, `domain`=검토 주소, `pnu`) → 최근 기준연도의 지목(`lndcgrCodeNm`)·용도지역(`prposArea1Nm`)·공시지가(`pblntfPclnd`). 필드명 실제 확인 필요.

#### 4.5 TourAPI 주변 관광지 (SIM-04 시연판)
- 좌표 기준 반경 내 관광지 목록 → 직선거리 상위 3곳. 화면에 "경로 기준 준비 중" 표기. 경로 기준 이동시간은 11.7.
- **진행 메모**: 2026-10-11 코드 완료(실제 응답 확인 전). TourAPI `KorService2/locationBasedList2`(관광지 contentTypeId 12, 반경 20km) → 직선거리(haversine) 가까운 3곳. 확인 화면에 '주변 관광지' 카드(직선거리·경로 기준 준비 중·출처·조회 시각), `properties.nearby`에 저장. 좌표가 없으면(직접 입력 주소) 조회하지 않음.

#### 4.6 시연용 조회 결과 저장
- 시연에 쓸 대표 주소 2곳(예: 1호점 주소, 시나리오 1 예시 주소)의 4.2~4.5 결과를 `seed/demo-fixtures.json`에 저장. 외부 API가 실패하면 이 결과로 대체하는 스위치를 둔다.
- **표시 규칙**: 저장 결과를 쓸 때는 값의 `source`를 `fixture`로 두고, 화면 출처를 "시연용 저장 데이터", 조회 시점을 실제 저장한 날짜로 표시한다. 실시간 조회로 보이면 안 된다.
- **완료 기준**: 스위치를 켜면 대표 주소 2곳이 외부 호출 없이 진행되고, 화면에 "시연용 저장 데이터"가 보인다.
- **진행 메모**: 2026-10-11 틀 완료, 데이터 대기. 저장 데이터는 `functions/src/external/demo-fixtures.ts`(함수와 함께 배포되도록 seed/ 대신 여기 둠, 지금은 빈 목록). PNU 또는 검색어 포함으로 매칭. 스위치 = Firestore `config/demo` 문서 `useFixtures: true`(콘솔에서 바꿈): 켜면 저장 주소는 외부 호출 없이 반환, 꺼져 있어도 외부 실패 시 저장 데이터로 대체. 출처 `demoFixture` → 화면 '시연용 저장 데이터', 조회 시각 = `savedAt`(테스트 3개). **남은 일**: 키 발급 후 대표 주소 2곳 실제 조회 → 결과를 fixtures에 저장.

---

### Phase 5. 기준값 관리 (10/13–10/17)

#### 5.1 단가 DB 화면 (ADM-01)
- **컬렉션**: `priceVersions/{version}` = {effectiveFrom, status(draft/active/retired), data, createdBy, approvedBy}.
- **흐름**: 석원이 "새 버전 만들기"(현재 active 복사 → draft) → 값 수정 → PM이 검토 후 적용(active, 이전 버전 retired). 두 사람 확인 원칙.
- **참고 화면**: 목업 `adm-price-db`.
- **진행 메모**: 2026-10-09 완료. `/admin/prices`(목록·새 초안), `/admin/prices/[version]`(편집기 `components/admin/price-editor.tsx`, 대표 예시 검증 사례). 공통 틀 `version-shell.tsx`(저장·삭제·적용, 미저장 경고), 운영팀 보호 `staff-context.tsx`. 적용은 callable `activateVersion`(functions/src/versions.ts 검증 → 기존 active를 retired, 새 버전 active, auditLogs). 문서 필드: status, data(PriceTable), note, basedOn, createdBy/Name/At, updatedBy/Name/At, approvedBy/Name/At, effectiveFrom, retiredAt.

#### 5.2 가정값 화면 (ADM-02)
- **컬렉션**: `assumptionVersions/{version}`. 평일가·주말가, 연평균 가동률(계산용), 성수기·비수기 가동률(근거 표시용), 운영비 기본값(변동/고정 구분), 3안 편차.
- **검증 사례**: 저장할 때 3.4 수익 검증표 조건으로 엔진을 돌려 결과를 화면에 표시(기준값과 다르면 경고).
- **참고 화면**: 목업 `adm-assume`.
- **진행 메모**: 2026-10-09 완료. `/admin/assumptions`, 편집기 `assumption-editor.tsx`(13개 기본값, 3안 편차, 가동률 범위, 성수기·비수기는 근거 표시용), 수익 검증표 15개 항목 자동 비교. 서버 검증이 '하한+보수 편차 ≥ 10%, 상한+낙관 편차 ≤ 95%'를 막는다.

#### 5.3 수정 금지 규칙
- status가 active·retired인 버전 문서는 update·delete 금지. draft만 수정 가능. 단가는 `canEditPrices`, 가정값은 `canEditAssumptions` 권한자만 draft 생성.
- **진행 메모**: 2026-10-09 완료(배포). `firestore.rules`의 priceVersions·assumptionVersions: 회원은 active만 읽기, 운영팀은 전체 읽기, 편집 권한자만 draft 생성·수정·삭제, status 변경과 active·retired 수정은 불가(함수만). 규칙 테스트 `tests/rules/versions.rules.test.ts` 7개는 Java 설치 후 실행.

#### 5.4 초기 버전 입력
- `seed/price-v2026.10-1.json`, `seed/assumption-v0.3.json`을 만들고 시드 스크립트로 입력. 값은 3.2 표·3.4 기본값, D5·D6 도착 시 교체.
- **진행 메모**: 2026-10-09 완료. 시드 스크립트 대신 관리 화면에서 '임시 기준값'으로 초안을 만들어 적용했다. 단가 **v2026.10-1** 적용 중, 가정값 **v0.3** 적용 중(처음에 제안 이름 v0.1로 만들어 적용한 뒤 같은 값으로 v0.3을 만들어 다시 적용, v0.1은 이전 버전). 두 버전 모두 검증 사례 일치 확인. **버전 이름은 '새 초안 만들기'의 버전 이름 칸에서 만들 때만 정할 수 있다.**

#### 5.5 `[원일]` D6 (10/17)
- 수익 가정값(가동률·객실가·운영비) 확정, 3안 편차(−15%p/+10%p) 유지 여부, 객실가 변동 포함 여부(prd.md 14절).
- **PM이 받은 뒤 할 일**: 5.6 절차대로 전환한다.
- **진행 메모**:

#### 5.7 `[원일·개발]` 수익 검증 사례 테스트 (10/21)
- **위치**: `web/src/lib/engine/revenue.cases.test.ts`. 기존 `revenue.test.ts`의 검증표 테스트 형식을 따라, D6 값으로 원일이 손으로 계산한 사례(3안 포함) 3개 이상을 표 형태로 넣는다.
- **완료 기준**: 테스트가 통과하거나, 어긋나면 엔진과 원일 계산 중 어느 쪽이 맞는지 PM과 확인해 기록한다. 5.6 재검증에 쓴다.
- **진행 메모**: 2026-10-10 PM 틀 완료: 사례 표(`CASES`) + 비교 테스트, 예시 1행(검증표). 원일이 D6 사례 행을 추가한다.

#### 5.6 최종 기준값 전환·재검증·승인 (10/19)
- **배경**: 3.4·5.4까지는 목업 값(임시)으로 개발한다. D5(10/14)·D6(10/17)가 오면 최종 값으로 바꾸고 다시 검증한다.
- **절차**:
  1. 석원(D5)·원일(D6)이 관리자 화면에서 새 draft 버전을 만든다(단가 `v2026.10-2`, 가정값 `v0.4` 등).
  2. PM이 엔진 테스트를 새 값으로 다시 돌린다. D5에서 공정·규칙(철거 조건, 병행 공정, "모름" 가산)이 바뀌었으면 엔진 코드도 고친다.
  3. 대표 예시 결과가 바뀌면 3.4 기대값, prd.md 7.1·7.2 기준값, 공유 PRD 문서를 함께 고친다. 고친 사실을 팀에 공유한다.
  4. 단가는 석원, 가정값은 원일이 새 결과를 확인하고, PM이 active로 적용한다(두 사람 확인 원칙).
- **완료 기준**: active 버전이 최종 값이고, 테스트·PRD 기준값·화면 검증 사례가 같은 숫자를 보인다. 이후 시연까지 기준값을 바꾸지 않는다(바꾸면 이 절차를 다시 밟는다).
- **진행 메모**:

---

### Phase 6. 진단 입력 흐름 (10/13–10/19)

#### 6.1 단계 표시줄·자동 저장
- 진단 6단계: 주소 → 확인 → 사진 → 체크리스트 → 견적 → 수익. 로그인·동의 후에만 시작.
- 단계마다 `assessments/{id}`(status=draft)에 저장. 마이페이지에서 이어서 진행 가능. 계정 기준 저장이라 브라우저·기기가 바뀌어도 로그인하면 이어진다.
- 진단 삭제·취소 버튼은 두지 않는다. 삭제는 11.2 삭제 요청 경로로 처리한다.
- 상태 변화는 "작업 전체에 걸친 규칙"의 진단 상태 규칙을 따른다.
- **진행 메모**: 2026-10-10 코드 완료, 10/11 검토 URL에서 주소→수익까지 한 흐름 확인(PM). `/diagnose`(새 진단 시작·내 진단 이어하기), `/diagnose/[id]/{address,confirm,photos,checklist,estimate,revenue}`. `assessments.reached`(도달 단계)까지만 열고 그 뒤 주소는 도달 단계로 보낸다. 저장은 단계 '다음'마다, 체크리스트는 답마다. 코드: `lib/diagnosis/{steps,store}.ts`, `components/diagnose/*`(버튼 모양은 6.7 공통 UI로 교체 예정). 규칙: 본인 진단만 읽기·쓰기, status·uid는 회원이 못 바꿈(7.4·9.1에서 넓힘), 연결 빈집은 본인 것만. **약관 개정 시 기존 진단 열람 허용**은 아직 아님(지금은 재동의 전 진단 화면 전체를 막음).

#### 6.2 주소 입력 (SIM-01)
- 목업 `sim-address`. 검색 → 후보 선택 → `properties/{id}` 생성. 필지 연결 실패 시 "다음 단계에서 직접 입력" 안내.
- **진행 메모**: 2026-10-10 화면 완료. 검색창 + 직접 입력(도로명 필수, 지번 선택). 검색은 `lib/diagnosis/address.ts`의 `searchAddress`가 4.2 전까지 '사용 불가'를 던지고 화면이 직접 입력 안내를 띄운다(4.2에서 본문만 교체). 주소 저장 시 `properties` 문서를 만들고(욕실·주방 1개 기본값) 다시 고치면 주소만 바꾼다.

#### 6.3 자동조회 확인·수정 (SIM-02, 03, 05)
- 목업 `sim-confirm`. 조회값마다 출처·조회 시각 표시, 모든 값 수정 가능. 수정하면 `facts.{key}`에 `userEdited: true`, `originalValue` 보관. "대장 없음" 선택 시 `noRegistry: true` → 인허가 리스크 플래그 + 불확실도 +10%p.
- **진행 메모**: 2026-10-10 화면 완료(외부 조회 없이 직접 입력). 항목 정의 `lib/diagnosis/facts.ts`: 건축물대장 5개(연면적 필수), 토지 3개, 직접 입력 2개(욕실·주방 수, 필수). 값마다 출처·조회 시각·수정 여부·원래 값 표시, 빈 값은 '결측'. `editFact`가 조회값을 고치면 `originalValue`를 처음 한 번만 보관(테스트). '대장 없음' 체크 → `properties.noRegistry`. 출처 `demoFixture`('시연용 저장 데이터')를 미리 정의(4.6).

#### 6.4 사진 업로드 (SIM-06)
- 목업 `sim-photo`. 부위 8종(외관 정면·후면·좌측·우측, 지붕, 주방, 욕실, 벽체 균열), 최대 20장. 브라우저에서 리사이즈하며 EXIF 제거 후 Storage 업로드. "나중에 올리기" 허용. 누락 부위 수는 엔진 입력.
- **사진 없이 진행**: 사진을 하나도 올리지 않아도 다음 단계로 갈 수 있다(누락 부위만큼 불확실도 가산).
- **주의**: 외부 사용자에게는 D8 확정 전까지 이 단계를 숨긴다(11.2). 시연은 팀 계정으로만 진행.
- **완료 기준**: GPS 정보가 들어 있는 테스트 사진을 올린 뒤 Storage에서 내려받은 파일에 EXIF(특히 GPS)가 남아 있지 않음을 확인한다(예: `exifr`로 읽어 빈 결과). 이 확인을 자동 테스트로 남긴다.
- **진행 메모**: 2026-10-10 코드 완료, 실제 업로드 확인 대기. 부위 8종·최대 20장·부위별 가이드(D9 전 임시 문구), 브라우저에서 회전 반영·긴 변 1600px·JPEG 0.85로 다시 그린 뒤 `stripJpegMetadata`로 APP1~15·COM 구간 제거(`lib/diagnosis/photo-file.ts`). 자동 테스트: piexifjs로 GPS를 넣은 JPEG → exifr로 위치 확인 → 제거 후 EXIF 없음. 파일 `users/{uid}/assessments/{id}/photos/{photoId}.jpg`, 기록에 `exifStripped`·`consentModelUse`(선택 동의)·`deleteAfter: null`(D8 후). Storage 규칙은 경로의 uid로 주인 확인, 담당 건(assigned) 운영팀 읽기만 Firestore 담당자 조회. (처음엔 경로 `assessments/{id}/photos`에 교차 서비스 규칙으로 주인을 확인했으나 IAM 권한 부여 후에도 `storage/unauthorized`로 거부되어 10/11 경로를 바꿈. Storage 서비스 계정에 'Firebase Rules Firestore Service Agent' 역할은 부여해 둠.) 회원 계정은 업로드 대신 건너뛰기 안내(운영팀만 업로드). 10/11 검토 URL에서 PC 사진 업로드 성공 확인. **남은 일**: GPS가 든 휴대폰 사진 업로드 → Storage에서 내려받은 파일에 GPS 없음 확인(완료 기준).

#### 6.5 상태 체크리스트 (SIM-07)
- 목업 `sim-check`의 10문항(누수, 수도, 전기, 정화조, 마지막 거주, 균열, 기울어짐, 욕실, 주방, 난방). 10문항 모두 답해야 "견적 계산하기" 활성. "모름"은 불확실도 가산.
- **진행 메모**: 2026-10-10 화면 완료. `CHECKLIST_QUESTIONS`(3.7)로 10문항을 그리고 답마다 저장, 10개 모두 답하면 '견적 계산하기' → 견적 단계(7.1 전까지 저장된 입력 요약 화면).

#### 6.6 `[해순]` D9, `[원일]` D7 (10/14)
- D9 부위별 촬영 가이드 문구·예시 사진 → 6.4 화면에 반영. D7 인허가 간이 확인 항목·경고 문구·관할 기관 안내 → 7.2에 반영.
- **진행 메모**: 2026-10-15 관리 화면 추가(팀원이 직접 입력, 배포 없이 반영): `/admin/permits`(D7, 가정값 또는 콘텐츠 편집 권한 → 원일·해순·주연): 모든 집 항목 추가·삭제·순서(최대 12), 조건부 4개(대장 없음·주택 아닌 용도 `{용도}`·맹지·좁은 길 `{도로}`)는 문구만, 관할 기관 칸 추가, '가능' 판정 표현·빈 칸·자리표시 누락은 저장 전 차단. `/admin/photo-guides`(D9, 콘텐츠 편집 권한 → 해순·주연): 부위 8곳 문구(200자, 비우면 기본 문구). 저장 위치 Firestore `siteContent/permits`·`photoGuides`(누구나 읽기, 규칙 테스트 2개 추가 → 39개). 화면: 견적·리포트 `permitItems(..., content)`, 사진 단계 `photoGuide(id, guides)`, 문서가 없거나 읽기 실패면 기본 문구. 코드 `lib/site-content/{content,store}.ts`(테스트 5개). 리포트의 인허가 문구는 스냅샷이 아니라 지금 문구로 보인다. 예시 사진 칸은 없음(필요하면 추가). **남은 일**: 원일·해순 입력.

#### 6.7 `[주연·개발]` 공통 UI 컴포넌트 (10/17)
- **위치**: `web/src/components/ui/`. 목업(`mockup/`)의 색·글꼴·간격을 Tailwind 토큰으로 옮기고, 버튼·카드·면책 배너·진단 단계 표시줄(모양만, 동작은 6.1에서 PM이 연결) 컴포넌트를 만든다.
- **규칙**: 데이터 읽기·쓰기 없이 화면 모양만 다룬다. 주요 버튼 높이 48px 이상, 본문 16px 이상(9.5 기준). 확인용 견본 페이지 `/ui`(시연 전 삭제)에 모아 보인다.
- **완료 기준**: `npm run lint`·`npm run typecheck` 통과, PM 검토 후 이후 화면이 이 컴포넌트를 쓴다.
- **진행 메모**: 2026-10-10 PM 준비 완료: `globals.css`에 목업 밝은 화면 색 토큰(`bg-accent`, `text-ink` 등), `components/ui/index.ts`(만들 목록·규칙), 견본 페이지 `/ui`(색 견본). 글꼴(목업 IBM Plex Sans KR·Hahmlet)과 어두운 화면 색은 주연이 정한다.
  - 2026-10-15 PM 개발 완료: `components/ui/`에 `Button`·`ButtonLink`(primary·secondary·ghost·danger, md 48px·sm 40px, block), `Card`·`CardHead`(default·flat·highlight), `Notice`(warn·info·crit·neutral, 아이콘), `Pill`(7가지 색, 점), `StepBar`(done·current·todo, 모양만), `DisclaimerBox`. 견본 `/ui`. 연결: `diagnose/styles.ts`의 btnPrimary·card·notice 등을 공통 컴포넌트 클래스로 바꿔 진단·상담·마이페이지 화면이 한 번에 새 모양을 쓰고, 진단 단계 표시줄·면책 문구·상태 배지 5곳(인허가 상태, 시연용 저장 데이터, 결측, AI 가상 이미지, 상담 단계)을 컴포넌트로 교체. 관리자·리포트 화면은 아직 자체 모양. **남은 일**: 주연 디자인 기준(글꼴·어두운 화면·모양) 반영, 새 화면(홈·숙소)은 처음부터 이 컴포넌트로.

---

### Phase 7. 결과 화면 (10/16–10/24)

#### 7.1 견적 결과 (SIM-08, 15)
- 목업 `sim-estimate`. 합계·범위·공기, 공정별 구분(기본 공사/상태별 보수)·판정·금액·근거. 모든 수치 옆 ⓘ → 출처·조회 시점·가정값·단가 버전. IoT 행에 "설치비만 추정, 자동 연동·관제는 Phase 2 이후". 면책 문구 상시 표시.
- **진행 메모**: 2026-10-10 화면 완료, 10/11 검토 URL에서 결과 표시 확인(PM). `components/diagnose/estimate-step.tsx`: 합계·범위·공기, 'ⓘ 범위 이유'(기본·사진 누락·대장 없음·모름), 모듈 A/B/C·철거 포함 선택(즉시 재계산), 공정별 구분·판정·금액·ⓘ 근거(기준수량·단가·상태계수·작업일·단가 버전, IoT 문구), 소계·예비비·합계, 단가 없는 공정·사진 없는 부위 '현장 확인 필요', 면책·계산 기준일·버전. 계산은 `lib/diagnosis/compute.ts`(테스트 7개). **주의**: 체크리스트 판정(3.7)이 욕실·주방만 채워져 있어 지금 견적에는 지붕·구조 보수가 빠진다(석원 작업 후 반영).

#### 7.2 위험 신호·인허가 (SIM-10, 11)
- 위험 신호(큰 균열 "손가락 들어갈 정도", 기울어짐 "많이", 지붕 붕괴 — D4로 확정) → 수익 화면 대신 "전문가 진단 필수" + 현장진단 신청 버튼을 먼저 노출, 진단 status=expertRequired.
- 인허가: D7 항목별 상태(`확인 필요` / `주의 신호 없음` / `확인됨`)와 다음 행동. "가능" 표시 금지, "법적 판정 아님" 상시.
- **진행 메모**: 2026-10-10 화면 완료. 위험 신호가 있으면 견적 위에 '전문가 진단 필수' + 현장진단 신청 버튼, 수익 버튼은 보조('그래도 수익 시뮬레이션 보기'), 스냅샷 저장 시 status=expertRequired. 위험 신호 판정 자체는 3.7(석원)이 채운다. 인허가는 `lib/diagnosis/permits.ts` 임시 항목 3개(+대장 없음 리스크), 모두 '확인 필요', '법적 판정 아님' 상시. D7(원일) 오면 항목 교체.

#### 7.3 수익 시뮬레이션·3안 (SIM-12, 13, 14)
- 목업 `sim-revenue`. 슬라이더 5개 + "운영비 가정 더 보기" 8개. "지역 기본값으로" 버튼. 값을 바꾸는 즉시 3안 재계산. 포함 비용·제외 비용(세금·금융비용·대규모 수선비), "세후 순이익 아님" 상시 표시.
- **진행 메모**: 2026-10-10 화면 완료. 슬라이더 5개(평일·주말 요금, 가동률 25~85%, OTA 수수료율, 판매 불가일) + '운영비 가정 더 보기' 8개, '지역 기본값으로', 3안 표(가동률·매출·운영비·차감 후 추정액·회수 기간·손익분기 가동률) 즉시 재계산, 포함·제외 비용과 '세후 순이익 아님' 상시. 위험 신호가 있으면 상단에 참고용 안내.

#### 7.4 계산 스냅샷 (SIM-20)
- **생성 시점(단일 규칙)**: ① 견적 결과 화면에 처음 도달할 때 ② "저장"·"PDF 받기"·상담 신청 버튼을 누를 때, 현재 입력이 마지막 스냅샷과 다르면 새로 만든다. 슬라이더 조작 중에는 저장하지 않는다.
- **내용**: `assessments/{id}/snapshots/{id}` = inputs, priceVersion, assumptionVersion, formulaVersion, result(반올림 전 계산값), createdBy. 생성 후 `assessments.latestSnapshotId`, `latestSummary`(합계·월 추정액) 갱신.
- **참조**: PDF와 상담은 버튼을 누른 시점의 스냅샷 ID를 저장해, 나중에 입력이 바뀌어도 당시 결과를 가리킨다.
- **완료 기준**: 같은 입력·버전으로 다시 계산하면 같은 결과. 슬라이더를 여러 번 움직이고 "저장"을 누르면 스냅샷이 1개만 생긴다.
- **진행 메모**: 2026-10-10 코드 완료. `lib/diagnosis/snapshot-store.ts` `ensureSnapshot`: 입력(견적 입력·체크리스트·수익 입력·버전 3종)의 지문(`inputsKey`, FNV-1a)이 `assessments.latestInputsKey`와 같으면 만들지 않고 마지막 id를 돌려준다. 만들 때 진단의 `latestSnapshotId`·`latestSummary`·`estimateOptions`·`revenueInput`·status(saved/expertRequired, consult는 유지)를 같은 배치로 갱신. 규칙: 스냅샷은 추가만, 진단 status는 회원이 saved/expertRequired로만, 연결 스냅샷은 같은 배치의 본인 스냅샷이어야 함(규칙 테스트 3개 추가, Java 설치 후 실행). 슬라이더는 저장하지 않으므로 여러 번 움직이고 '저장'하면 1개만 생긴다.

#### 7.5 다음 행동 버튼 (SIM-17)
- 현장진단 신청 / 턴키 PM 상담 / PDF 받기 / 저장. 상담 버튼은 진단 ID를 넘겨 9.1 폼에 자동 연결.
- **진행 메모**: 2026-10-10 버튼 완료. 현장진단·턴키 PM → 스냅샷 확보 후 `/consult?assessment=&type=&snapshot=`(9.1 전까지 자리 화면), PDF → `/diagnose/[id]/report?snapshot=`(8.1 전까지 자리 화면), 저장 → '저장했습니다'/'이미 저장된 내용입니다'.

#### 7.6 응답 성능 (SIM-19)
- 체크리스트 완료 → 결과 표시 3초 이내(외부 API 시간 제외). 계산은 브라우저에서 즉시 하고, 7.4의 스냅샷 저장은 화면 표시를 기다리게 하지 않는다(저장이 끝나기 전에도 결과를 먼저 보여준다).
- **진행 메모**: 2026-10-10 구조 반영. 계산은 브라우저에서 즉시(useMemo), 첫 도달 스냅샷은 결과 표시 뒤 배경에서 저장. 기준값(적용 버전 2건)·사진 목록 읽기만 기다린다. **남은 일**: 실제 기기에서 체크리스트 완료 → 결과 표시 시간 측정. 2026-10-19 개선: ① 체크리스트 완료 저장을 쓰기 2번 → 1번(`finishChecklist`) ② 적용 기준값을 체크리스트 화면에서 미리 읽고 2분 기억(`loadActiveVersionCached`) → 견적 화면은 사진 목록만 기다림 ③ 측정: '견적 계산하기' → 견적 표시 시간을 콘솔(`[온기로] 견적 표시까지 ○ms`)과 Analytics 이벤트 `result_ready`(ms)로 남김. **남은 일**: 검토 URL에서 휴대폰으로 몇 번 진단해 시간 확인(Analytics는 하루 뒤 이벤트 화면에서 확인), 3초 이내면 홈에 "3초 안에 결과" 문구 복원 검토.

---

### Phase 8. 리포트·마이페이지 (10/22–10/26)

#### 8.1 PDF 리포트 (SIM-16)
- 목업 `sim-report`. A4 인쇄용 페이지 + 인쇄 CSS, 사용자는 브라우저 인쇄로 PDF 저장.
- **필수 내용**: 진단 ID, 주소, 계산 기준일, 적용 버전(단가·가정값·계산식), 예상 공사비·범위·공기, 3안 표, 포함·제외 비용, 면책 문구, 인허가 "법적 판정 아님". 하나라도 빠지면 통과 아님. 페이지 수는 실제 내용 기준.
- **진행 메모**: 2026-10-11 화면 완료, 실제 인쇄 확인 대기. `/report/[진단]/[스냅샷]`(`components/report/report-view.tsx`): 저장된 스냅샷만 읽어 표시(재계산 없음). 진단 번호(`DX-`+id 앞 8자), 주소, 계산 기준일(스냅샷 시각), 버전 3종, 공사비·범위·공기·불확실도 근거, 공정표, 위험 신호, 3안 표, 가정값 13개, 포함·제외 비용·세후 순이익 아님, 인허가(법적 판정 아님), 면책. 'PDF로 저장(인쇄)' 버튼 → 브라우저 인쇄, `globals.css`에 A4 `@page`·`print:hidden`. 결과 화면 'PDF 받기'와 마이페이지에서 연다. 상담 담당(전체 권한)도 읽을 수 있다. **남은 일**: 크롬에서 A4 PDF 저장해 잘림·페이지 나눔 확인, 면책 문구는 D8 후 교체.

#### 8.2 마이페이지 (COM-03)
- 목업 `mypage`. 내 진단 목록(진단 ID·주소·진단일·견적 합계·월 추정액·상태), 리포트 다시 보기(저장된 스냅샷 기준, 재계산 아님), 상담 신청 내역·상태.
- **진행 메모**: 2026-10-11 화면 완료. `/me`: 내 진단(진단 번호·상태·진단일·견적 합계·기본안 월 추정액, '리포트 다시 보기'=마지막 스냅샷, '이어서 하기/결과·입력 보기'), 상담 신청 내역(유형·단계·신청일·연결 진단·담당자, '신청 당시 리포트'). 리포트·마이페이지는 `RequireLogin`(약관 재동의 전에도 열람 가능). 진단 화면 머리말에 마이페이지 링크.

#### 8.3 D8 (10/21, PM 초안 → `[원일]` 검토)
- 약관, 개인정보 처리방침, 견적 면책 문구, 진단 사진 보관 기간·삭제 절차. 받으면 2.2 동의 문구·8.1 면책 문구 교체.
- 개인정보 처리방침에 이용 분석 도구(Google Analytics for Firebase) 사용과 수집 항목을 넣어야 한다(Firebase 프로젝트에서 Analytics를 켬).
- **진행 메모**: 2026-10-11 PM 초안 작성 → 원일 검토 대기. 공유 문서 https://claude.ai/code/artifact/a76a3595-e6f0-4856-a0d5-260900a38474 (이용약관 8조, 개인정보 처리방침: 실제 저장 항목 기준 수집표·처리 위탁·국외 이전(App Hosting 대만, Analytics 미국)·권리·보호책임자, 견적 면책 문구 5곳, 사진 정책, 동의 화면 문구 5개, 결정 필요 12개). 법률 검토 표시 3곳(책임 제한, 국외 이전, 상담 기록 보관). 확정되면 `lib/consent/definitions.ts` 문구 교체·버전 올림, `components/diagnose/disclaimer.tsx`·리포트 하단 문구 교체.

---

### Phase 9. 상담·스테이·홈 (10/27–10/30)

#### 9.1 상담 신청 (CON-01)
- 목업 `con-apply`. 유형(현장진단/턴키 PM/빈집 맡기기), 신청인, 연락처, 소유 관계(본인/가족/공동상속), 연결 진단(자동), 희망 연락일, 메모, 전화 상담 요청. 공동상속이면 "동의서는 계약 단계에서 준비" 안내만.
- 저장: `consultations/{id}` status=접수, 신청 시점 스냅샷 ID 포함. 연결된 진단 status=consult(이미 consult면 유지, expertRequired면 유지).
- 한 진단에 상담 여러 건 신청 가능. 이후 상담 단계가 보류·계약 등으로 바뀌어도 진단 상태는 consult를 유지한다.
- **진행 메모**: 2026-10-11 화면 완료. `/consult?assessment=&type=&snapshot=`(`components/consult/consult-apply.tsx`): 유형 3개(설명 포함), 신청인(회원 이름 기본), 연락처, 소유 관계(공동상속 → 동의서는 계약 단계 안내), 희망 연락일, 메모, 전화 상담 요청. 같은 배치로 `consultations` 생성(status=received, 스냅샷 id) + 진단 status=consult·`lastConsultId`(expertRequired면 status 유지). 규칙이 '같은 배치의 본인 상담이 이 진단을 가리키는지' 확인. 진단 없이도 신청 가능(홈 '빈집 맡기기' 용도, type=entrust). 접수 알림은 관리자 메뉴 '상담' 배지(새 접수 수, 전체 권한만).

#### 9.2 상담 관리 (CON-02)
- 목업 `adm-consult`. 칸반 6단계(접수/연락/방문 예정/제안/계약/보류), 유형 필터, 담당자 배정, 메모, 전화 접수 대리 입력(`proxyEnteredBy`).
- **이력**: 상태 변경, 담당자 배정·변경, 메모 수정을 모두 `consultations/{id}/events`에 기록한다. 이벤트 = {kind(status/assignee/memo), before, after, actorUid, at}.
- 담당자 배정 시 연결 진단의 `assigneeUid`에 복사(사진 "담당 건" 권한 판정용). 한 진단에 상담이 여러 건이면 가장 최근에 배정된 담당자를 복사한다.
- 알림: 접수 시 운영팀 알림(시연에서는 이메일 또는 관리자 화면 배지). 실패해도 관리자 화면에 표시. 운영 기준: 영업일 1일 내 첫 연락, 원일이 매일 오전 확인.
- **진행 메모**: 2026-10-11 화면·함수 완료. `/admin/consults`(`components/admin/consult-board.tsx`): 6단계 칸반(모바일은 세로), 유형 필터, 카드 선택 → 상세(연락처 전화 링크, 소유 관계, 희망일, 연결 진단의 신청 당시 리포트, 신청 메모), 단계 옮기기(원일의 `canTransition`으로 거름), 담당자 배정(전체 권한만, 운영팀 목록), 운영팀 메모(`staffMemo`, 신청 메모와 별도), 변경 이력. 전화 접수 대리 입력(전체 권한). 변경은 서버 함수 `updateConsultation`(권한·입력 검증, events 기록, 담당자를 진단 `assigneeUid`에 복사)·`createProxyConsultation`(`proxyEnteredBy`) — `functions/src/consult.ts` 테스트 7개. 담당 건 권한은 본인 배정 상담만 조회. **남은 일**: D13 단계 규칙은 화면에서만 거르고 서버는 단계 이름만 검사(원일 규칙 확정 후 서버에도 반영 검토), 이메일 알림은 시연 후.

#### 9.3 `[해순·개발]` 숙소 상세·외부 예약 (STY-01, 02) (10/27)
- **PM이 먼저**: `branches` 문서 타입·읽기 함수·보안 규칙, 시연용 샘플 데이터. 해순은 화면만 만든다.
- 목업 `stay-detail`. `branches/{id}.content`에서 읽어 표시(관리자가 수정 가능하게). 에어비앤비·네이버 예약 버튼, 클릭 수 기록(Analytics 이벤트).
- **진행 메모**: 2026-10-10 PM 준비 완료: `lib/branches/{types,store,sample}.ts`(콘텐츠 구조, `getBranch`, 문서가 없으면 샘플), 규칙 `branches` 누구나 읽기·쓰기 금지(배포, 규칙 테스트 2개 추가), 화면 자리 `/stay/[id]`(`stay-detail.tsx`, 확인 주소 `/stay/sample-1`). 콘텐츠 편집 화면·쓰기 규칙·Analytics 클릭 기록은 PM이 나중에.
  - 2026-10-11 PM 몫 완료: 관리 화면 `/admin/branches`(목록·새 숙소)·`/admin/branches/[id]`(기본 정보, 사진 올리기·설명·순서·빼기, 청결, 편의·안전 시설, 체험, 위치·요금·예약 링크), 저장 전 검사 `lib/branches/validate.ts`(테스트 5개), 샘플 id로 만들면 샘플 내용에서 시작. 사진은 `preparePhoto`로 줄이고 메타데이터를 지워 Storage `branches/{id}/photos`(공개 읽기, 콘텐츠 편집 권한자만 업로드)에 올림. 규칙: `branches` 쓰기는 `canEditContent`(id 형식·필드 검사, 삭제 금지, 규칙 테스트 2개 갱신). 관리자 메뉴 '숙소'. 예약 클릭 기록은 `lib/analytics.ts` `trackReserveClick(branchId, channel)` — 해순이 화면 버튼에서 부른다. **남은 일**: 해순 화면(9.3), D12 콘텐츠 입력(해순·주연 모두 편집 권한 있음), 홈 카드 링크를 실제 숙소 id로.
  - 2026-10-15 PM 화면 완료: `stay-detail.tsx`(목업 stay-detail): 사진(첫 장 크게 + 4장, 6장 이상이면 '사진 모두 보기', 휴대폰은 옆으로 넘기기, 사진 설명 표시), 지점·제목·요약, 청결 관리, 편의·안전 시설 배지, 체험 카드, 위치(줄바꿈 유지), 요금·예약 칸(평일·주말 범위, 체크인·아웃, 예약 링크가 있는 채널만 버튼 → 새 창 + `trackReserveClick`, 링크가 없으면 '예약 링크를 준비 중'). 요금은 저장값이 문자열이어도 숫자로 읽는다. 샘플 숙소는 '샘플' 안내. 머리말·바닥글은 홈과 같은 `components/site-chrome.tsx`. 홈 카드는 이미 `/stay/onkiro-1`로 연결(9.4). `/stay/onkiro-1` 데스크톱·375px 캡처 확인. **남은 일**: 에어비앤비·네이버 예약 링크 입력(관리 화면), 사진 onkiro1~5(PM 폴더 Work_for_AI) 관리 화면에서 추가, D12로 2호점.

#### 9.4 `[주연·개발]` 서비스 소개 홈 (COM-01) (10/28)
- 목업 `home`. 미션, 진단·재생·운영 소개, 위탁 운영 모델("운영 조건은 협의 사항"), 1·2호점 카드, CTA 2개(내 빈집 진단하기 → 로그인/주소 입력, 빈집 맡기기 상담 → 상담 신청).
- **진행 메모**: 2026-10-15 PM 개발 완료. `app/page.tsx`(머리말: 로고·내 진단·상담 링크, 첫 화면 문구·버튼 2개 → `/diagnose`·`/consult?type=entrust`, 진단·재생·운영 카드 3개, 빈집 맡기기 카드 + '운영 조건은 협의 사항' 배지, 고친 집 카드, 바닥글), `components/home/branch-showcase.tsx`(Firestore `branches`를 한 번 읽어 첫 화면 큰 사진 = 1호점 첫 사진, 숙소 카드 최대 2개 → `/stay/{id}`, 2개보다 적으면 '준비 중' 칸). 목업과 다른 점: '3초 안에 결과'는 7.6 측정 전이라 빼고 "모든 금액은 추정치" 문구로, 재생 카드는 하·중·상 등급(기본형·표준형·고급형)으로, 숙소 상태 배지(운영 중·공사 중)는 숙소 문서에 상태 필드가 없어 뺐다. 데스크톱·375px 캡처 확인. **남은 일**: 주연 홈 문구 반영, 2호점 문서가 생기면 자동으로 카드가 바뀜. 참고: 헤드리스 Chrome의 `--screenshot`·`--timeout`은 가상 시간이라 Firestore 응답 전에 찍힌다(검토 시 실제 브라우저로 볼 것).

#### 9.5 `[주연·개발]` 반응형 점검 (COM-05) (10/28)
- 360px 폭에서 모든 시연 화면 가로 스크롤 없음, 본문 16px 이상, 주요 버튼 높이 48px 이상.
- **진행 메모**: 2026-10-17 PM 점검: 로컬 에뮬레이터(아래 환경 메모)에 시연 계정으로 로그인해 375px로 홈·숙소·진단 6단계·리포트·상담 신청·마이페이지·관리 화면 전체를 캡처. 고친 것: ① 견적 '공정별 비용' 표가 640px라 금액이 화면 밖 → 휴대폰은 공정|예상 비용 두 칸(판정·구분·근거는 공정 아래), 소계·합계 정렬 ② 수익 3안 표가 520px라 기본·낙관안이 밖 → 작은 글자·좁은 여백으로 한 화면에 ③ 리포트 공정 표 금액 줄바꿈 → 휴대폰은 '구분' 숨김(인쇄는 보임), 금액 한 줄 ④ 단계 표시줄이 넘칠 때 지금 단계가 보이게 가로 자동 스크롤 ⑤ 주소 '검색' 버튼이 두 줄로 깨짐 ⑥ "연면적을(를)" → 받침에 맞는 조사(`lib/korean.ts`) ⑦ 마이페이지·상담 신청에 로고 머리말. 관리 화면은 페이지가 넘치지 않고 넓은 표(단가 편집 등)만 표 안에서 옆으로 밀림(관리 도구라 유지). 남은 일: 실제 휴대폰(주연) 확인, 사진 업로드·AI 기능은 에뮬레이터에 함수가 없어 운영 검토 URL에서 확인.

#### 9.6 `[해순]` D12, `[원일]` D13
- D12 1·2호점 숙소 콘텐츠(10/21) → 9.3에 입력. D13 상담 상태별 처리 기준·담당 배정 규칙(10/17) → 9.7에서 원일이 코드로 옮긴다.
- **진행 메모**:

#### 9.7 `[원일·개발]` 상담 상태 전이·담당 배정 규칙 함수 (10/21)
- **위치**: `web/src/lib/consult/status.ts` + 테스트. 순수 함수.
- **PM이 먼저**: 상태 6단계 타입, `canTransition(from, to)`·배정 규칙 함수의 빈 껍데기와 예시 테스트.
- **원일**: D13대로 허용 전이(보류 포함)와 배정 규칙을 채우고 테스트를 쓴다.
- **완료 기준**: `npm test` 통과, PM이 9.2 칸반 화면과 보안 규칙에 연결.
- **진행 메모**: 2026-10-10 PM 뼈대 완료: 상담 유형 3개·칸반 6단계 상수, `canTransition`(같은 단계 금지·보류 항상 허용, 나머지 임시 허용), `suggestAssignee`(유형을 맡는 첫 사람), 테스트 4개 + todo 3개. 원일이 D13으로 채운다.

---

### Phase 10. 통합 테스트·시연 (10/29–11/3)

#### 10.1 보안 규칙 테스트
- `@firebase/rules-unit-testing`으로 역할별(비로그인, 회원 본인/타인, 해순, 석원, 원일, 주연, PM) 읽기·쓰기 허용/거부 테스트. 2.3 권한표의 각 권한 키마다 허용 1건·거부 1건 이상. 특히 사진 접근, 상담 담당 건, 스냅샷·active 버전 수정 금지.
- 시연 기간에는 2단계 인증을 강제하지 않는 상태로 테스트한다. 이 예외는 시연까지만 허용하고 11.3에서 해소한다.
- **진행 메모**: 2026-10-11 첫 실행(Java 설치 후): 35개 중 3개 실패 → 수정 후 35개 통과. ① 진단 수정 규칙이 `address`·`propertyId` 필드가 없는 문서에서 평가 오류로 거부 → `get(필드, null)`로 수정(앱은 항상 필드를 만들어 실사용 영향 없음). ② 회원이 스냅샷 없이 status를 saved로 바꿀 수 있었음 → 새 스냅샷을 연결할 때만 saved/expertRequired로 바뀌게 조임. 둘 다 배포. Storage 규칙 테스트는 아직 없음.
  - 2026-10-19 보강(60개 통과, `npm run test:rules`가 Firestore·Storage 에뮬레이터를 함께 띄움): ① `tests/rules/storage.rules.test.ts` — 진단 사진(주인·관리자·사진 전체 권한 읽기, 담당 건은 Firestore 담당자 교차 확인, 올리기 형식·크기·경로, 지우기 주인만), AI 가상 이미지(읽기만, 쓰기 금지), 숙소 사진(누구나 읽기, 콘텐츠 권한자만 올리기), 기본 거부 ② `tests/rules/roles.rules.test.ts` — 팀원 4명 권장 권한으로 사진 권한 all/assigned/none, 상담 권한 all/assigned/none, 아직 기능 없는 권한 키(검수·공사비·지점 실적·버전 승인)가 쓰기를 열지 않는지. **발견·수정**: Storage 진단 사진·숙소 사진이 같은 이름으로 덮어쓰기가 됐다(create가 기존 파일에도 통과) → `resource == null` 조건 추가(10/19 배포).

#### 10.2 시연 시나리오 3회 연속 통과
- 시나리오: 홈 → 카카오 로그인·동의 → 주소 검색 → 자동조회 확인 → 사진 업로드 → 체크리스트 → 견적 결과 → 수익 3안(슬라이더 조작) → PDF 인쇄 → 상담 신청 → (관리자) 상담 칸반에 접수 확인·상태 변경 → 마이페이지에서 상태 확인. + 숙소 상세, 단가·가정값 관리 화면.
- 미리보기 배포 URL에서, 모바일과 PC 각각 확인.
- **진행 메모**: 2026-10-19 대본 초안 `시연대본.md`: 역할·장비(PM 노트북+프로젝터, 원일 태블릿 칸반), D-1 준비 체크리스트(useFixtures, 사진 8장, **AI 결과 미리 한 번 생성**해 두면 시연 때 저장본이 즉시 나옴, 예비 진단 2건(완료본·위험 신호), 칸반 비우기, 핫스팟), 장면 0~15(약 16분, ★=시간 부족 시 필수), 장면마다 말할 내용·막히면 대처, 예상 질문 6개와 담당, 3회 통과 기록표. 금액 칸 `[ ]`은 D5·D6 최종 적용 후 리허설에서 채움.
  - 2026-10-19 대본 개정: 대표 주소 1 '시연 답변' 표(11문항) 추가, 금액을 확정 기준값·v1.2로 채움(중 약 3,500만·2,900~4,100만·28일, 하 3,200만·상 3,700만, 기본안 월 320만·차감 후 140만·회수 약 25개월). 이 금액은 테스트 `web/src/lib/diagnosis/demo-script.test.ts`가 지킨다(기준값을 바꾸면 테스트와 대본을 함께 고침). 사진 10장(필수 8 + 대표 방·조경), AI 선택 동의, 가상 이미지 미리 생성 6장(중 4곳 + 하·상 외관), 리허설 진단 관리자 삭제, 예상 질문(보관 1년/3년·해외 AI 동의) 반영. 관리자 '시연 전 준비 현황'에 **적용 중 단가·가정값이 확정안과 같은지** 2줄 추가(검증 사례 결과로 비교, `priceMatchesReference`·`assumptionMatchesReference`).

#### 10.3 시연 데이터·계정 준비
- 4.6 대표 주소 2곳, 시연용 회원 계정, 운영팀 계정 5개, 사진 샘플, 1·2호점 콘텐츠. 외부 API 실패 대체 스위치 동작과 "시연용 저장 데이터" 표시 확인.
- 운영팀 계정은 2단계 인증 없이 쓰므로, 시연 기간에는 검토 URL을 팀 밖에 공유하지 않는다.
- **진행 메모**: 2026-10-19 개발 쪽 준비: UI 견본 `/ui`는 배포본에서 404(로컬 개발 서버에서만), 에뮬레이터 시드의 적용 중 기준값을 확정안(`v2026.10-2`·`v0.4`)으로 바꿔 로컬 리허설 금액이 대본과 같다. 대표 주소 2곳 저장 데이터(`demo-fixtures.ts`)는 10/13·10/14 실제 조회값 그대로 사용. **PM이 할 일**: 실제 Firebase에서 확정안 단가·가정값 적용(관리자 '시연 전 준비 현황'이 모두 완료가 되면 됨), `config/demo.useFixtures` 켜기, 시연 사진 10장, PM 계정 AI 선택 동의, 리허설 때 AI 결과 미리 생성.

#### 10.4 `[전원]` 팀 리허설 (11/2)
- 팀원이 각자 역할 화면을 직접 조작(석원: 단가 버전, 원일: 가정값·상담 접수, 주연: 홈·공통 화면, 해순: 숙소 콘텐츠). 발견 문제는 당일 수정 가능한 것만 고친다.
- **진행 메모**:

#### 10.5 `[전원]` 시연 (11/3)
- **진행 메모**:

---

### Phase 11. 시연 후·베타 전 (11/4 ~ 베타 오픈일)

**베타 진입 조건**: 11.2~11.8 완료 + D8(사진 정책) 확정 + 10.1 보안 규칙 테스트를 2단계 인증 강제 상태로 다시 통과. 11.9(P1)는 베타 진입 조건이 아니다.

#### 11.1 베타 오픈일·작업별 마감 확정 (11/10)
- PRD는 베타를 "2027 Q1"로만 정해 두었다. 시연 결과를 반영해 PM이 베타 오픈일을 정하고, 11.2~11.8 각 작업의 마감일을 이 목록 체크리스트 옆에 적는다.
- 순서 권장: 11.3(보안) → 11.2(사진 정책) → 11.4·11.5(데이터 수집) → 11.6 → 11.7 → 11.8.
- **결제 계정 확인**: Firebase 프로젝트(`onkiro-2fe12`)는 Google Cloud 무료 체험판 결제 계정(2026-10-08 가입, 크레딧 300달러, 90일)에 연결했다. 체험판은 2027년 1월 초에 끝나므로, 그 전에 결제 계정을 유료로 업그레이드해야 함수·저장소가 멈추지 않는다. 베타 오픈일을 정할 때 함께 처리한다.
- **진행 메모**:

#### 11.2 사진 정책 반영·사진 업로드 개방
- D8 확정 후: 보관 기간 경과 사진 자동 삭제 스케줄 함수(`deleteAfter` 기준), 삭제 요청 처리(관리자 화면에서 진단·사진 삭제 + 처리 기록), 선택 동의 철회 시 `consentModelUse=false`. 이 작업이 끝나야 외부 사용자에게 사진 단계를 연다.
- **진행 메모**:

#### 11.3 관리자 2단계 인증
- Identity Platform TOTP. staff·admin은 미설정 시 관리자 화면 진입 차단 → 설정 화면으로. 분실 시 PM이 재설정. 완료 후 10.1 테스트를 강제 상태로 다시 돌린다.
- **진행 메모**:

#### 11.4 진단 검수 (ADM-03)
- 목업 `adm-review`(사진 AI 영역은 숨김). `canReviewDiagnosis` 권한자(석원)가 공정별 판정·금액 보정, 보정 사유 필수 → 새 스냅샷(parentSnapshotId=원본), 원 결과 보관.
- **진행 메모**:

#### 11.5 현장진단·실제 공사비 (CON-03, CON-07)
- 목업 `adm-cost`. 현장진단 입력 항목은 D10. 실제 공사비는 공정·자재·비용·공기·증빙 입력 → `canReviewCosts` 권한자(석원) 검수 후 approved. 비교는 공정 소계(예비비 제외), 검수 전 항목 제외.
- **진행 메모**:

#### 11.6 지점 실적 (DAT-01)
- 목업 `ops-pnl` 상단. `canEnterBranchRecords` 권한자(원일)가 일별 판매 박수·순매출·판매 불가 여부·사유 입력 + 엑셀 가져오기(양식 D11). 월 순매출·가동률(판매 가능일 기준)·운영비·차감 후 금액 자동 계산, 수정 이력(`auditLogs`).
- **예측 연결 준비**: 이 단계에서 `branches/{id}.baselineSnapshotId`(nullable) 필드와, 1·2호점 각각의 기준 시뮬레이션 스냅샷을 만들어 연결해 둔다. 실적은 지점 ID + 날짜(일별)·월(비용)로 저장되므로, DAT-02(11.9)는 "지점의 baselineSnapshotId 기본안 vs 해당 월 실적"으로 비교한다.
- **진행 메모**:

#### 11.7 관광 입지 경로 기준 (SIM-04)
- 카카오 모빌리티 길찾기로 경로 기준 이동시간·이동수단(차량/도보). 실패 시 직선거리.
- **진행 메모**:

#### 11.8 서버 PDF (SIM-16)
- Cloud Functions + 헤드리스 브라우저(메모리 1GiB 이상)로 8.1 페이지를 PDF로 생성·다운로드. 8.1과 같은 필수 내용 기준.
- **진행 메모**:

#### 11.9 P1 기능 (베타 진입 조건 아님)
- 순서: SIM-18 비회원 체험(사진 제외) → CON-04 위탁 제안서(D14) → DAT-02 예측 vs 실적(11.6에서 준비한 `baselineSnapshotId`) → CON-08 재생 적합도(D14) → STY-03 체험 소개(D15) → ADM-04 정확도 리포트 → STY-05 AI 컨시어지(D15).
- **진행 메모**:

#### 11.10 베타 오픈
- 대상: 홍성군 귀촌건축지원센터·평생학습관 수강생. 측정 지표(prd.md 1.3): 진단 완료 100건, 상담 전환 10%(진단 완료 후 30일 내 상담 신청 비율, 진단 기준 1건).
- **진행 메모**:
