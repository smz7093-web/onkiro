import type { ReactNode } from "react";
import { cx } from "./cx";

// 상태 배지 (목업 .pill). 점(dot)은 상태를 색 말고도 모양으로 구분하게 돕는다
export type PillTone =
  "neutral" | "good" | "warn" | "crit" | "info" | "accent" | "ochre";

const TONE: Record<PillTone, string> = {
  neutral: "bg-surface-2 text-ink-2",
  good: "bg-good-soft text-good",
  warn: "bg-warn-soft text-warn",
  crit: "bg-crit-soft text-crit",
  info: "bg-info-soft text-info",
  accent: "bg-accent-soft text-accent",
  ochre: "bg-ochre-soft text-ochre",
};

export function Pill({
  tone = "neutral",
  dot = true,
  className,
  children,
}: {
  tone?: PillTone;
  dot?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-semibold whitespace-nowrap",
        TONE[tone],
        className,
      )}
    >
      {dot && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
