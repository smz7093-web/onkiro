"use client";

import { useState } from "react";
import {
  CHECKLIST_QUESTIONS,
  type ChecklistAnswers,
} from "@/lib/engine/checklist";
import {
  aiErrorMessage,
  analyzeDiagnosisPhotos,
  type PhotoSuggestion,
} from "@/lib/ai/store";
import { PHOTO_PARTS } from "@/lib/diagnosis/photos";
import { finishStep, saveChecklist } from "@/lib/diagnosis/store";
import { useDiagnosis } from "./diagnosis-context";
import { btnPrimary, btnSecondary, card } from "./styles";

// 4단계 상태 체크리스트 (SIM-07, task.md 6.5). 답을 고를 때마다 저장한다.
// 10문항 모두 답해야 "견적 계산하기"가 켜진다. 판정 규칙은 석원의 evaluateChecklist(3.7)가 맡는다.
// AI 사진 분석(10/14): 올린 사진으로 일부 문항의 답을 제안한다. 자동으로 고르지 않고, 회원이 적용을 누른다.
const CONFIDENCE_LABEL = { high: "높음", medium: "보통", low: "낮음" } as const;
const partLabel = (id: string) =>
  PHOTO_PARTS.find((p) => p.id === id)?.label ?? id;

export function ChecklistStep() {
  const { assessment, reload, go, isTeam } = useDiagnosis();
  const [suggestions, setSuggestions] = useState<PhotoSuggestion[] | null>(
    null,
  );
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  async function analyze() {
    setAiBusy(true);
    setAiError(null);
    try {
      setSuggestions((await analyzeDiagnosisPhotos(assessment.id)).result);
    } catch (e) {
      setAiError(aiErrorMessage(e));
    } finally {
      setAiBusy(false);
    }
  }
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

      {isTeam && (
        <section className="flex flex-col gap-2 rounded-lg border border-line-2 bg-surface-2 p-4">
          <h2 className="text-base font-semibold">AI 사진 분석</h2>
          <p className="text-sm text-ink-2">
            올린 사진을 AI가 보고 누수·균열·기울어짐·욕실·주방 문항의 답을
            제안합니다. 제안은 참고용이며, 적용할지는 직접 고릅니다. 분석을 위해
            사진이 AI 서비스(Anthropic, 미국)로 전송됩니다.
          </p>
          <div>
            <button
              type="button"
              className={btnSecondary}
              disabled={aiBusy}
              onClick={analyze}
            >
              {aiBusy
                ? "사진을 분석하는 중… (20~60초)"
                : suggestions
                  ? "다시 분석하기"
                  : "사진으로 답 제안받기"}
            </button>
          </div>
          {aiError && (
            <p role="alert" className="text-base text-crit">
              {aiError}
            </p>
          )}
          {suggestions && suggestions.length === 0 && (
            <p className="text-base">
              사진에서 판단할 수 있는 문항이 없었습니다. 직접 골라 주세요.
            </p>
          )}
        </section>
      )}

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
            <AiSuggestion
              s={suggestions?.find((x) => x.questionId === q.id)}
              optionLabel={(id) => q.options.find((o) => o.id === id)?.label}
              applied={(id) => answers[q.id] === id}
              onApply={(id) => answer(q.id, id)}
            />
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

function AiSuggestion({
  s,
  optionLabel,
  applied,
  onApply,
}: {
  s: PhotoSuggestion | undefined;
  optionLabel: (id: string) => string | undefined;
  applied: (id: string) => boolean;
  onApply: (id: string) => void;
}) {
  if (!s) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md bg-info-soft px-3 py-2 text-sm">
      <span>
        <b>AI 제안: {optionLabel(s.answer)}</b> (확신{" "}
        {CONFIDENCE_LABEL[s.confidence]}){s.reason && ` — ${s.reason}`}
        {s.parts.length > 0 && ` [${s.parts.map(partLabel).join(", ")}]`}
      </span>
      {applied(s.answer) ? (
        <span className="text-info">적용됨</span>
      ) : (
        <button
          type="button"
          onClick={() => onApply(s.answer)}
          className="min-h-10 rounded-md border border-info px-3 text-info"
        >
          이 답 적용
        </button>
      )}
    </div>
  );
}
