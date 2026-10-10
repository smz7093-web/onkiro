"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { canOpen, STEPS } from "@/lib/diagnosis/steps";
import { useDiagnosis } from "./diagnosis-context";

// 진단 단계 표시줄 (task.md 6.1). 모양은 주연의 공통 StepBar(6.7)가 나오면 바꾼다.
export function StepBar() {
  const { assessment } = useDiagnosis();
  const current = usePathname().split("/").at(-1);
  return (
    <nav aria-label="진단 단계">
      <ol className="flex flex-wrap gap-x-1 gap-y-2 text-sm">
        {STEPS.map((s, i) => {
          const open = canOpen(s.id, assessment.reached);
          const active = s.id === current;
          const label = `${i + 1}. ${s.label}`;
          const cls = `inline-flex h-9 items-center rounded-full px-3 ${
            active
              ? "bg-accent font-semibold text-accent-ink"
              : open
                ? "bg-accent-soft text-ink"
                : "bg-surface-2 text-muted"
          }`;
          return (
            <li key={s.id}>
              {open && !active ? (
                <Link
                  href={`/diagnose/${assessment.id}/${s.id}`}
                  className={cls}
                >
                  {label}
                </Link>
              ) : (
                <span
                  className={cls}
                  aria-current={active ? "step" : undefined}
                >
                  {label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
