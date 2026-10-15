// 진단·상담·마이페이지 화면의 버튼·카드·안내 모양. 공통 UI(components/ui, task.md 6.7)에서 가져온다.
// 새 코드는 components/ui의 Button·Card·Notice를 직접 쓴다. 이 이름들은 기존 화면 호환용이다.
import { buttonClass, cardClass, noticeClass } from "../ui";

export const btnPrimary = buttonClass({ variant: "primary" });
export const btnSecondary = buttonClass({ variant: "secondary" });
export const btnGhost = buttonClass({ variant: "ghost" });
export const input =
  "h-12 w-full rounded-md border border-line-2 bg-surface px-3 text-base text-ink focus-visible:outline-2 focus-visible:outline-accent";
export const card = cardClass();
export const notice = noticeClass("warn");
export const info = noticeClass("info");
