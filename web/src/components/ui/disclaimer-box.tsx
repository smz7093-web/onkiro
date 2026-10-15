import type { ReactNode } from "react";
import { cx } from "./cx";

// 면책 안내 상자: 추정치·법적 판정 아님 같은 상시 안내 (prd.md 1.2 원칙 1). 글자 14px, 색 ink-2
export function DisclaimerBox({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <aside
      className={cx(
        "rounded-lg border border-line bg-surface-2 px-4 py-3 text-sm text-ink-2",
        className,
      )}
    >
      {children}
    </aside>
  );
}
