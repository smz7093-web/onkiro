# 온기로 개발 참여 가이드 (팀원용)

2026-10-10부터 팀원 네 명도 각자 전문 분야의 모듈을 하나씩 개발한다(prd.md 3.3절). 이 문서는 처음 설치부터 PR을 올리기까지의 순서다. 막히면 혼자 오래 붙잡지 말고 PM에게 바로 묻는다.

## 1. 내 담당 모듈

| 팀원 | 모듈 | 고쳐도 되는 위치 | task.md | 마감 |
| --- | --- | --- | --- | --- |
| 주연 | 공통 UI 컴포넌트 | `web/src/components/ui/`, 견본 페이지 `web/src/app/ui/` | 6.7 | 10/17 |
| 주연 | 서비스 소개 홈, 반응형 점검 | `web/src/app/(public)/` (숙소 `stay/` 제외) | 9.4, 9.5 | 10/28 |
| 석원 | 체크리스트 → 공정 판정·위험 신호 함수 | `web/src/lib/engine/checklist.ts`, `checklist.test.ts` | 3.7 | 10/17 |
| 원일 | 수익 검증 사례 테스트 | `web/src/lib/engine/revenue.cases.test.ts` | 5.7 | 10/21 |
| 원일 | 상담 상태 전이·담당 배정 규칙 함수 | `web/src/lib/consult/` | 9.7 | 10/21 |
| 해순 | 숙소 상세 화면 | `web/src/app/(public)/stay/` | 9.3 | 10/27 |

각 작업의 요구사항과 완료 기준은 `task.md`의 해당 번호에 있다. 함수의 입력·출력 타입, 숙소 데이터 읽기 함수처럼 시작에 필요한 뼈대는 PM이 먼저 만들어 둔다.

**PM만 고치는 곳**: 위 표 밖의 모든 파일. 특히 `firestore.rules`·`storage.rules`(보안 규칙), `functions/`(서버 함수), `web/src/lib/firebase/`·`lib/auth/`·`lib/permissions.ts`(로그인·권한), `lib/engine/`의 기존 파일(견적·수익 계산), `package.json`(라이브러리 추가), `apphosting.yaml`·`firebase.json`(배포 설정). 바꿔야 할 것 같으면 PR 설명에 적거나 PM에게 요청한다.

## 2. 처음 한 번 설치

1. **Node.js 22 LTS** 설치: https://nodejs.org (설치 후 터미널에서 `node -v`가 v22로 나오면 된다)
2. **Git** 설치: https://git-scm.com (Windows는 기본 옵션 그대로)
3. **VS Code** 설치(권장): https://code.visualstudio.com
4. **Claude Code** 설치(권장): 코드 작성은 Claude Code에게 맡기고, 결과를 화면과 테스트로 확인하는 방식으로 진행한다. 저장소의 `web/CLAUDE.md`·`web/AGENTS.md`에 이 프로젝트의 주의사항이 있어 Claude Code가 자동으로 읽는다.
5. GitHub 초대 메일을 수락한 뒤 저장소를 내려받는다.

```bash
git clone https://github.com/smz7093-web/onkiro.git
cd onkiro/web
npm install
```

6. 개발 서버를 띄워 확인한다. 브라우저에서 http://localhost:3000 이 열리면 성공이다.

```bash
npm run dev
```

## 3. 작업할 때마다

```bash
# 1) 최신 main 받기
git switch main
git pull

# 2) 내 작업 브랜치 만들기 (이름: 이름-작업번호-짧은설명)
git switch -c seokwon-3.7-checklist

# 3) 코드 작성 → 검사 (web 폴더에서)
npm run lint
npm run typecheck
npm test

# 4) 저장하고 올리기
git add -A
git commit -m "체크리스트 판정 함수: 누수·균열 문항 매핑"
git push -u origin seokwon-3.7-checklist
```

5) GitHub 저장소 페이지에 뜨는 **Compare & pull request** 버튼으로 PR을 만든다. PR 설명에는 무엇을 했는지, 어떻게 확인했는지(화면 캡처나 테스트 결과), 남은 문제를 적는다.

6) PM이 검토하고 의견을 남긴다. 고친 뒤 같은 브랜치에 다시 commit·push하면 PR에 자동으로 반영된다. PM이 승인하고 `main`에 합치면 팀 검토 URL에 자동 배포된다.

Claude Code를 쓰면 위 과정을 "3.7 작업 브랜치 만들어 줘", "검사 돌리고 PR 올려 줘"처럼 말로 시켜도 된다. 다만 PR을 올리기 전에 바뀐 파일 목록이 1절의 "고쳐도 되는 위치" 안에 있는지 직접 확인한다.

## 4. 규칙

- `main`에 직접 push하지 않는다. 모든 변경은 PR로 올린다.
- `npm run lint`·`npm run typecheck`·`npm test`가 모두 통과해야 PR을 올린다. 통과하지 않으면 PR 설명에 그 사실과 오류 내용을 적는다.
- 계산 로직(석원·원일)은 산출물(D4·D6·D13)의 표 한 줄마다 테스트를 하나 이상 쓴다. 테스트가 "이 기준이 코드에 그대로 들어갔다"는 증거다.
- 화면(주연·해순)은 목업(`mockup/` 폴더, 브라우저로 `mockup/index.html` 열기)을 참고하되 동작과 문구는 `prd.md`를 따른다. 폭 360px(휴대폰)에서도 가로 스크롤이 없게 만든다.
- 비밀 값(API 키, 비밀번호)은 코드·커밋·PR·채팅 어디에도 붙이지 않는다.
- PR 하나에는 작업 하나만 담는다. 작게 자주 올리는 편이 검토가 빠르다.

## 5. 자주 막히는 곳

| 증상 | 해결 |
| --- | --- |
| `npm`을 찾을 수 없다 | Node.js 설치 후 터미널을 새로 연다 |
| `git push`가 권한 오류 | GitHub 초대를 수락했는지 확인, 처음 push 때 뜨는 GitHub 로그인 창에서 로그인 |
| `git pull`에서 충돌(conflict) | 혼자 풀지 말고 PM에게 브랜치 이름을 알려 준다 |
| 로그인이 필요한 화면을 보고 싶다 | 로컬에서도 카카오 로그인이 된다(`/login`). 관리자 화면 권한은 PM이 부여한다 |
| 테스트가 내 작업과 상관없는 곳에서 실패 | `main`을 다시 받아(`git switch main && git pull`) 확인하고, 그래도 실패하면 PM에게 알린다 |
