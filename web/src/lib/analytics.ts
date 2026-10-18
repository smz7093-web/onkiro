"use client";

import {
  getAnalytics,
  isSupported,
  logEvent,
  type Analytics,
} from "firebase/analytics";
import { firebaseApp } from "./firebase/client";

// 이용 분석 (Google Analytics for Firebase). 개인정보 처리방침(D8)에 고지한다.
// 브라우저가 지원하지 않거나 차단하면 조용히 넘어간다 (화면 동작에 영향을 주지 않는다).
let analytics: Promise<Analytics | null> | null = null;

function getClient() {
  if (typeof window === "undefined") return Promise.resolve(null);
  analytics ??= isSupported()
    .then((ok) => (ok ? getAnalytics(firebaseApp) : null))
    .catch(() => null);
  return analytics;
}

// 체크리스트 '견적 계산하기' → 견적 화면 표시까지 걸린 시간 (SIM-19, task.md 7.6).
// 실제 기기에서 잰다. 콘솔에도 남기고, Analytics 이벤트 result_ready(ms)로 모은다
const RESULT_TIMER = "onkiro:resultTimer";
export function startResultTimer() {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(RESULT_TIMER, String(Date.now()));
}
export function stopResultTimer() {
  if (typeof window === "undefined") return;
  const start = Number(sessionStorage.getItem(RESULT_TIMER));
  sessionStorage.removeItem(RESULT_TIMER);
  if (!start) return;
  const ms = Date.now() - start;
  console.info(`[온기로] 견적 표시까지 ${ms}ms`);
  void getClient().then((a) => {
    if (a) logEvent(a, "result_ready", { ms });
  });
}

// 숙소 외부 예약 버튼 클릭 (STY-02, task.md 9.3). 해순의 숙소 화면에서 버튼을 누를 때 부른다.
export function trackReserveClick(
  branchId: string,
  channel: "airbnb" | "naver",
) {
  void getClient().then((a) => {
    if (a) logEvent(a, "reserve_click", { branch_id: branchId, channel });
  });
}
