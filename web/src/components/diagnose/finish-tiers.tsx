"use client";

import { useMemo, useState } from "react";
import {
  aiErrorMessage,
  explainGrades,
  type GradeExplainInput,
  type GradeExplanation,
} from "@/lib/ai/store";
import {
  CHECKLIST_QUESTIONS,
  type ChecklistAnswers,
} from "@/lib/engine/checklist";
import type { EstimateInput, ModuleType, PriceTable } from "@/lib/engine/types";
import {
  FINISH_TIERS,
  MODULE_SCOPE,
  tierEstimates,
} from "@/lib/diagnosis/compute";
import type { Facts } from "@/lib/diagnosis/facts";
import { RemodelPreview } from "./remodel-preview";
import { btnSecondary, card } from "./styles";

const manwon = (won: number) =>
  `${Math.round(won / 10_000).toLocaleString("ko-KR")}만 원`;

const factValue = (facts: Facts, key: keyof Facts) => facts[key]?.value ?? null;

// 실내 마감 등급(하·중·상) 견적 3개를 나란히 보여주고 고르게 한다 (10/14 추가).
// 금액은 단가 DB 계산값이다. 'AI 등급 설명'은 등급별 자재 예시와 추천만 보여준다.
export function FinishTiers({
  assessmentId,
  facts,
  checklist,
  estimateInput,
  price,
  selected,
  onSelect,
}: {
  assessmentId: string;
  facts: Facts;
  checklist: ChecklistAnswers;
  estimateInput: EstimateInput;
  price: PriceTable;
  selected: ModuleType;
  onSelect: (m: ModuleType) => void;
}) {
  const tiers = useMemo(
    () => tierEstimates(estimateInput, price),
    [estimateInput, price],
  );
  const [ai, setAi] = useState<GradeExplanation | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  async function askAi() {
    setAiBusy(true);
    setAiError(null);
    const input: GradeExplainInput = {
      house: {
        // 주소는 AI에 보내지 않는다 (D8 국외 이전 항목 최소화, 10/15)
        address: null,
        floorArea: estimateInput.floorArea,
        structure: factValue(facts, "structure") as string | null,
        roofStructure: factValue(facts, "roofStructure") as string | null,
        approvalDate: factValue(facts, "approvalDate") as string | null,
        zoning: factValue(facts, "zoning") as string | null,
        floors: factValue(facts, "floors") as number | null,
        mainPurpose: factValue(facts, "mainPurpose") as string | null,
        roadSide: factValue(facts, "roadSide") as string | null,
        terrain: factValue(facts, "terrain") as string | null,
        landUse: factValue(facts, "landUse") as string | null,
      },
      checklist: CHECKLIST_QUESTIONS.map((q) => ({
        question: q.label,
        answer:
          q.options.find((o) => o.id === checklist[q.id])?.label ?? "미응답",
      })),
      tiers: FINISH_TIERS.map((t) => ({
        ...t,
        unitPrice: price.moduleUnitPrices[t.module],
        total: tiers[t.module].total,
        rangeLow: tiers[t.module].rangeLow,
        rangeHigh: tiers[t.module].rangeHigh,
      })),
      purpose: "농촌 빈집을 고쳐 독채 숙소로 운영",
    };
    try {
      setAi((await explainGrades(assessmentId, input)).result);
    } catch (e) {
      setAiError(aiErrorMessage(e));
    } finally {
      setAiBusy(false);
    }
  }

  const aiTier = (m: ModuleType) => ai?.tiers.find((t) => t.module === m);

  return (
    <section className={card}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">실내 마감 등급별 견적</h2>
        <span className="text-sm text-ink-2">
          같은 집·같은 상태에서 실내 마감만 바꾼 금액
        </span>
      </div>
      <p className="text-sm text-ink-2">실내 마감 범위: {MODULE_SCOPE}</p>
      <div
        role="radiogroup"
        aria-label="실내 마감 등급"
        className="grid gap-3 sm:grid-cols-3"
      >
        {FINISH_TIERS.map((t) => {
          const e = tiers[t.module];
          const on = selected === t.module;
          const recommended = ai?.recommended === t.module;
          return (
            <button
              key={t.module}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onSelect(t.module)}
              className={`flex flex-col gap-1 rounded-lg border p-4 text-left ${
                on
                  ? "border-2 border-accent bg-accent-soft"
                  : "border-line-2 bg-surface"
              }`}
            >
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-semibold">
                  {t.grade} · {t.name}
                </span>
                {recommended && (
                  <span className="rounded bg-accent px-2 py-0.5 text-sm text-accent-ink">
                    AI 추천
                  </span>
                )}
              </span>
              <span className="text-sm text-ink-2">{t.concept}</span>
              <span className="text-sm">{t.finishes}</span>
              <span className="text-sm text-ink-2">
                모듈 {t.module} · 실내 ㎡당{" "}
                {price.moduleUnitPrices[t.module].toLocaleString("ko-KR")}원
              </span>
              <span className="text-2xl font-semibold">{manwon(e.total)}</span>
              <span className="text-sm text-ink-2">
                범위 {manwon(e.rangeLow)} ~ {manwon(e.rangeHigh)}
              </span>
              {aiTier(t.module) && (
                <span className="mt-2 flex flex-col gap-1 border-t border-line pt-2 text-sm">
                  <span className="text-ink-2">자재 예시</span>
                  <span>{aiTier(t.module)!.materials.join(" · ")}</span>
                  <span className="text-ink-2">{aiTier(t.module)!.fit}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {!ai && (
        <div className="flex flex-col gap-2">
          <div>
            <button
              type="button"
              className={btnSecondary}
              disabled={aiBusy}
              onClick={askAi}
            >
              {aiBusy
                ? "AI가 분석하는 중… (10~30초)"
                : "AI 등급 설명·추천 받기"}
            </button>
          </div>
          {aiError && (
            <p role="alert" className="text-base text-crit">
              {aiError}
            </p>
          )}
        </div>
      )}
      {ai && (
        <div className="flex flex-col gap-2 rounded-lg bg-surface-2 p-4">
          <h3 className="text-base font-semibold">
            AI 추천:{" "}
            {FINISH_TIERS.find((t) => t.module === ai.recommended)?.grade} ·{" "}
            {FINISH_TIERS.find((t) => t.module === ai.recommended)?.name}
          </h3>
          <p className="text-base">{ai.reason}</p>
          {ai.cautions.length > 0 && (
            <ul className="list-disc pl-5 text-base">
              {ai.cautions.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          )}
          <p className="text-sm text-ink-2">
            AI가 집 정보와 체크리스트를 보고 쓴 참고 설명입니다. 금액은 온기로
            단가 DB로 계산했고, 자재는 예시이며 현장진단에서 확정합니다.
          </p>
        </div>
      )}
      <RemodelPreview module={selected} />
    </section>
  );
}
