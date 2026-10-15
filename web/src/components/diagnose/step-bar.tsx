"use client";

import { usePathname } from "next/navigation";
import { canOpen, STEPS } from "@/lib/diagnosis/steps";
import { StepBar as StepBarView } from "../ui";
import { useDiagnosis } from "./diagnosis-context";

// 진단 단계 표시줄 (task.md 6.1). 모양은 공통 StepBar(6.7), 열 수 있는 단계는 도달 단계(reached)로 정한다.
export function StepBar() {
  const { assessment } = useDiagnosis();
  const current = usePathname().split("/").at(-1);
  return (
    <StepBarView
      label="진단 단계"
      steps={STEPS.map((s) => {
        const open = canOpen(s.id, assessment.reached);
        return {
          id: s.id,
          label: s.label,
          state: s.id === current ? "current" : open ? "done" : "todo",
          href: open ? `/diagnose/${assessment.id}/${s.id}` : undefined,
        };
      })}
    />
  );
}
