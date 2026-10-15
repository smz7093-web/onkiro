import type { ReactNode } from "react";
import { cx } from "./cx";

// 안내 상자 (목업 .notice). warn = 주의, info = 참고, crit = 위험·오류, neutral = 일반
export type NoticeTone = "warn" | "info" | "crit" | "neutral";

const TONE: Record<NoticeTone, { box: string; icon: string; mark: string }> = {
  warn: { box: "border-warn/30 bg-warn-soft", icon: "text-warn", mark: "!" },
  info: { box: "border-info/30 bg-info-soft", icon: "text-info", mark: "i" },
  crit: { box: "border-crit/30 bg-crit-soft", icon: "text-crit", mark: "!" },
  neutral: { box: "border-line bg-surface-2", icon: "text-muted", mark: "·" },
};

export function noticeClass(tone: NoticeTone = "warn") {
  return cx("rounded-lg border px-4 py-3 text-base text-ink", TONE[tone].box);
}

export function Notice({
  tone = "warn",
  title,
  children,
  className,
  role,
}: {
  tone?: NoticeTone;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
  role?: "alert" | "status";
}) {
  return (
    <div className={cx(noticeClass(tone), "flex gap-3", className)} role={role}>
      <span
        aria-hidden
        className={cx(
          "mt-0.5 grid size-6 flex-none place-items-center rounded-full border border-current text-sm font-bold",
          TONE[tone].icon,
        )}
      >
        {TONE[tone].mark}
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        {title && <b className="font-semibold">{title}</b>}
        {children}
      </div>
    </div>
  );
}
