"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { cx } from "./cx";

// 단계 표시줄 (목업 .stepper). 모양만 다룬다: 어느 단계가 끝났는지·열 수 있는지는 부르는 쪽이 정한다.
// done = 지나온(열 수 있는) 단계, current = 지금 단계, todo = 아직 못 여는 단계. href가 있으면 눌러서 이동한다.
export type StepState = "done" | "current" | "todo";

export interface StepItem {
  id: string;
  label: string;
  state: StepState;
  href?: string;
}

const ITEM: Record<StepState, string> = {
  done: "text-ink-2 hover:text-ink",
  current: "border-accent font-semibold text-ink",
  todo: "text-muted",
};

const DOT: Record<StepState, string> = {
  done: "border-accent-soft bg-accent-soft text-accent",
  current: "border-accent bg-accent text-accent-ink",
  todo: "border-line-2 text-muted",
};

export function StepBar({
  steps,
  label = "단계",
}: {
  steps: StepItem[];
  label?: string;
}) {
  // 휴대폰처럼 좁아서 옆으로 넘칠 때 지금 단계가 보이도록 가로로만 스크롤한다
  const navRef = useRef<HTMLElement>(null);
  const currentIndex = steps.findIndex((s) => s.state === "current");
  useEffect(() => {
    const nav = navRef.current;
    const el = nav?.querySelector<HTMLElement>('[aria-current="step"]');
    if (!nav || !el) return;
    const left =
      el.getBoundingClientRect().left -
      nav.getBoundingClientRect().left +
      nav.scrollLeft;
    nav.scrollLeft = Math.max(0, left - (nav.clientWidth - el.offsetWidth) / 2);
  }, [currentIndex]);
  return (
    <nav
      ref={navRef}
      aria-label={label}
      className="overflow-x-auto border-b border-line"
    >
      <ol className="flex min-w-max gap-5">
        {steps.map((s, i) => {
          const cls = cx(
            "-mb-px flex h-12 items-center gap-2 border-b-2 border-transparent text-base whitespace-nowrap",
            ITEM[s.state],
          );
          const inner = (
            <>
              <span
                aria-hidden
                className={cx(
                  "grid size-6 place-items-center rounded-full border-[1.5px] text-xs font-semibold",
                  DOT[s.state],
                )}
              >
                {i + 1}
              </span>
              {s.label}
            </>
          );
          return (
            <li key={s.id}>
              {s.href && s.state !== "current" ? (
                <Link href={s.href} className={cls}>
                  {inner}
                </Link>
              ) : (
                <span
                  className={cls}
                  aria-current={s.state === "current" ? "step" : undefined}
                >
                  {inner}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
