// 공통 UI 컴포넌트 (task.md 6.7, 10/15 PM 개발). 모양만 다루고 데이터 읽기·쓰기는 하지 않는다.
// 색은 globals.css의 목업 토큰만 쓴다. 주요 버튼 높이 48px(h-12) 이상, 본문 16px(text-base) 이상.
// 새 컴포넌트는 app/ui/page.tsx 견본에 추가한다. 글꼴·어두운 화면 색은 주연의 디자인 기준이 오면 바꾼다.
export { Button, ButtonLink, buttonClass } from "./button";
export type { ButtonSize, ButtonVariant } from "./button";
export { Card, CardHead, cardClass } from "./card";
export type { CardVariant } from "./card";
export { DisclaimerBox } from "./disclaimer-box";
export { Logo } from "./logo";
export { Notice, noticeClass } from "./notice";
export type { NoticeTone } from "./notice";
export { Pill } from "./pill";
export type { PillTone } from "./pill";
export { StepBar } from "./step-bar";
export type { StepItem, StepState } from "./step-bar";
