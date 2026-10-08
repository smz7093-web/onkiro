import { setGlobalOptions } from "firebase-functions/v2";
import { onCall } from "firebase-functions/v2/https";

// 모든 함수는 서울 리전에서 실행한다 (prd.md 10절 데이터 위치).
setGlobalOptions({ region: "asia-northeast3", maxInstances: 10 });

// 배포·에뮬레이터 연결 확인용. 외부 API 프록시(Phase 4)가 생기면 지운다.
export const ping = onCall(() => ({ ok: true, at: new Date().toISOString() }));
