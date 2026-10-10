"use client";

import { useState } from "react";
import {
  CHECKLIST_QUESTIONS,
  type ChecklistAnswers,
} from "@/lib/engine/checklist";
import { finishStep, saveChecklist } from "@/lib/diagnosis/store";
import { useDiagnosis } from "./diagnosis-context";
import { btnPrimary, btnSecondary, card } from "./styles";

// 4단계 상태 체크리스트 (SIM-07, task.md 6.5). 답을 고를 때마다 저장한다.
// 10문항 모두 답해야 "견적 계산하기"가 켜진다. 판정 규칙은 석원의 evaluateChecklist(3.7)가 맡는다.
export function ChecklistStep() {
  const { assessment, reload, go } = useDiagnosis();
  const [answers, setAnswers] = useState<Partial<ChecklistAnswers>>(
    assessment.checklist,
  );
  const [saveError, setSaveError] = useState(false);
  const [busy, setBusy] = useState(false);
  const answered = CHECKLIST_QUESTIONS.filter(
    (q) => answers[q.id] !== undefined,
  ).length;
  const complete = answered === CHECKLIST_QUESTIONS.length;

  async function answer(questionId: string, optionId: string) {
    const next = {
      ...answers,
      [questionId]: optionId,
    } as Partial<ChecklistAnswers>;
    setAnswers(next);
    try {
      await saveChecklist(assessment.id, next);
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  }

  async function done() {
    setBusy(true);
    try {
      await saveChecklist(assessment.id, answers);
      await finishStep(assessment, "checklist");
      await reload();
      go("estimate");
    } catch {
      setSaveError(true);
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-2xl font-semibold">집 상태를 알려주세요</h1>
        <span className="text-base text-ink-2">
          {answered} / {CHECKLIST_QUESTIONS.length}
        </span>
      </div>
      <p className="text-base text-ink-2">
        잘 모르면 &lsquo;모름&rsquo;을 골라도 됩니다. 모르는 항목이 많을수록
        견적 범위가 넓어져요.
      </p>

      <ol className={card}>
        {CHECKLIST_QUESTIONS.map((q, i) => (
          <li
            key={q.id}
            className="flex flex-col gap-2 border-b border-line py-3 last:border-0"
          >
            <span className="text-base" id={`q-${q.id}`}>
              <span className="mr-2 text-sm text-muted">
                {String(i + 1).padStart(2, "0")}
              </span>
              {q.label}
            </span>
            <div
              role="radiogroup"
              aria-labelledby={`q-${q.id}`}
              className="flex flex-wrap gap-2"
            >
              {q.options.map((o) => {
                const on = answers[q.id] === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => answer(q.id, o.id)}
                    className={`min-h-12 rounded-lg border px-4 text-base ${
                      on
                        ? "border-accent bg-accent text-accent-ink"
                        : "border-line-2 bg-surface text-ink"
                    }`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ol>

      {saveError && (
        <p role="alert" className="text-base text-crit">
          답을 저장하지 못했습니다. 인터넷 연결을 확인해 주세요.
        </p>
      )}
      <div className="flex justify-between gap-3">
        <button
          type="button"
          className={btnSecondary}
          onClick={() => go("photos")}
        >
          이전
        </button>
        <button
          type="button"
          className={btnPrimary}
          disabled={!complete || busy}
          onClick={done}
        >
          {busy ? "저장 중…" : "견적 계산하기"}
        </button>
      </div>
    </div>
  );
}
