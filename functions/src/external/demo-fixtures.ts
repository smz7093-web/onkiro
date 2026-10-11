import type { DemoFixture } from "./lookup.js";

// 시연용 저장 데이터 (task.md 4.6). 대표 주소 2곳(1호점, 시나리오 1 예시)의 실제 조회 결과를 키 발급 후 저장한다.
// savedAt은 실제로 조회해 저장한 시각이다. 화면에는 출처 '시연용 저장 데이터'와 이 시각이 보인다.
// 스위치: Firestore config/demo 문서의 useFixtures (true면 이 주소들은 외부를 부르지 않는다).
export const DEMO_FIXTURES: DemoFixture[] = [];
