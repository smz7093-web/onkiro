"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  RISK_FLAG_LABELS,
  type ChecklistAnswers,
} from "@/lib/engine/checklist";
import {
  PROCESS_LABELS,
  type ConditionGrade,
  type EstimateInput,
  type PriceTable,
  type ProcessCost,
} from "@/lib/engine/types";
import {
  DEFAULT_ESTIMATE_OPTIONS,
  defaultRevenueInput,
  type EstimateOptions,
} from "@/lib/diagnosis/compute";
import {
  PERMIT_DISCLAIMER,
  PERMIT_STATUS_LABELS,
  permitItems,
} from "@/lib/diagnosis/permits";
import { PHOTO_PARTS } from "@/lib/diagnosis/photos";
import {
  ensureSnapshot,
  saveResultInputs,
} from "@/lib/diagnosis/snapshot-store";
import { finishStep } from "@/lib/diagnosis/store";
import { useDiagnosis } from "./diagnosis-context";
import { Disclaimer } from "./disclaimer";
import { FinishTiers } from "./finish-tiers";
import { NextActions } from "./next-actions";
import { btnPrimary, btnSecondary, card, notice } from "./styles";
import {
  buildPayload,
  isChecklistComplete,
  useEstimate,
  useResultBasis,
} from "./use-result";
import { Pill } from "../ui";
import { usePermitContent } from "@/lib/site-content/store";

const GRADE_LABEL: Record<ConditionGrade, string> = {
  good: "양호",
  partial: "부분 보수",
  full: "전면 교체",
};
const GRADE_STYLE: Record<ConditionGrade, string> = {
  good: "bg-good-soft text-good",
  partial: "bg-warn-soft text-warn",
  full: "bg-crit-soft text-crit",
};

export const manwon = (won: number) =>
  `${Math.round(won / 10_000).toLocaleString("ko-KR")}만 원`;
const pctp = (r: number) => `${Math.round(r * 100)}%`;

// 5단계 견적 결과 (SIM-08, 10, 11, 15, task.md 7.1·7.2). 계산은 화면에서 바로 하고,
// 처음 도달할 때 스냅샷을 저장한다(7.4, 저장을 기다리지 않고 결과를 먼저 보여준다 7.6).
export function EstimateStep() {
  const { assessment, property, reload, go } = useDiagnosis();
  const permitContent = usePermitContent();
  const { basis, error: basisError } = useResultBasis();
  const [options, setOptions] = useState<EstimateOptions>(
    assessment.estimateOptions ?? DEFAULT_ESTIMATE_OPTIONS,
  );
  const { computation, error } = useEstimate(basis, options);
  const [busy, setBusy] = useState(false);

  const payload = useMemo(() => {
    if (!basis || !computation || !isChecklistComplete(assessment.checklist))
      return null;
    return buildPayload(
      basis,
      computation,
      assessment.checklist,
      options,
      assessment.revenueInput ?? defaultRevenueInput(basis.assumption),
    );
  }, [
    basis,
    computation,
    assessment.checklist,
    assessment.revenueInput,
    options,
  ]);

  // ① 견적 화면에 처음 도달할 때 스냅샷 (같은 입력이면 만들지 않는다)
  const firstView = useRef(false);
  useEffect(() => {
    if (!payload || firstView.current) return;
    firstView.current = true;
    ensureSnapshot(assessment, payload, "view")
      .then(() => reload())
      .catch(() => {
        // 화면 표시는 계속한다. 저장 버튼에서 다시 시도된다
      });
  }, [payload, assessment, reload]);

  if (basisError || error) {
    return (
      <div className="flex flex-col gap-4">
        <p className={notice}>{basisError ?? error}</p>
        <div>
          <button
            type="button"
            className={btnSecondary}
            onClick={() => go("checklist")}
          >
            체크리스트로
          </button>
        </div>
      </div>
    );
  }
  if (!basis || !computation || !property)
    return <p className="text-base">계산 중…</p>;

  const { estimate, estimateInput, checklist, expertRequired } = computation;
  const u = basis.price.uncertainty;
  const missingLabels = PHOTO_PARTS.filter((p) =>
    basis.missingParts.includes(p.id),
  ).map((p) => p.label);

  async function toRevenue() {
    setBusy(true);
    try {
      await saveResultInputs(assessment, options, null);
      await finishStep(assessment, "estimate");
      await reload();
      go("revenue");
    } catch {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {expertRequired && (
        <section className="flex flex-col gap-3 rounded-lg border-2 border-crit bg-crit-soft p-4">
          <h2 className="text-xl font-semibold text-crit">전문가 진단 필수</h2>
          <ul className="list-disc pl-5 text-base">
            {checklist.riskFlags.map((f) => (
              <li key={f.id}>
                <b>{RISK_FLAG_LABELS[f.id]}</b> — {f.reason}
              </li>
            ))}
          </ul>
          <p className="text-base">
            구조 안전이 확인되기 전에는 공사비와 수익 추정이 크게 달라질 수
            있습니다. 현장진단을 먼저 받아 보세요.
          </p>
          <NextActions
            payload={payload}
            actions={["inspection"]}
            primary="inspection"
          />
        </section>
      )}

      <section className="flex flex-col gap-2">
        <span className="text-sm text-ink-2">예상 공사비 · 예비비 포함</span>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="text-4xl font-semibold">
            {manwon(estimate.total)}
          </span>
          <span className="text-base text-ink-2">
            범위{" "}
            <b>
              {manwon(estimate.rangeLow)} ~ {manwon(estimate.rangeHigh)}
            </b>{" "}
            · 공사기간 <b>{estimate.days}일</b>
          </span>
        </div>
        <details className="text-sm text-ink-2">
          <summary className="min-h-11 cursor-pointer py-2">
            ⓘ 범위가 ±{pctp(estimate.uncertainty)}인 이유
          </summary>
          <ul className="list-disc pl-5">
            <li>기본 불확실도 {pctp(u.base)}</li>
            {estimateInput.missingPhotoParts > 0 && (
              <li>
                사진 없는 부위 {estimateInput.missingPhotoParts}곳 ×{" "}
                {pctp(u.perMissingPhotoPart)}
              </li>
            )}
            {estimateInput.noRegistry && (
              <li>건축물대장 없음 {pctp(u.noRegistry)}</li>
            )}
            {estimateInput.unknownAnswers > 0 && u.perUnknownAnswer > 0 && (
              <li>
                &lsquo;모름&rsquo; 답 {estimateInput.unknownAnswers}개 ×{" "}
                {pctp(u.perUnknownAnswer)}
              </li>
            )}
            <li>
              하한은 {manwon(basis.price.rangeRoundingUnit)} 단위로 내림, 상한은
              올림
            </li>
          </ul>
        </details>
      </section>

      <FinishTiers
        assessmentId={assessment.id}
        facts={property.facts}
        checklist={assessment.checklist as ChecklistAnswers}
        estimateInput={estimateInput}
        price={basis.price}
        selected={options.module}
        onSelect={(module) => setOptions({ ...options, module })}
      />

      {basis.price.processes.demolition?.baseApplies === "optional" && (
        <section className={card}>
          <h2 className="text-lg font-semibold">공사 조건</h2>
          <label className="flex min-h-12 items-center gap-2 text-base">
            <input
              type="checkbox"
              className="size-5"
              checked={options.demolition}
              onChange={(e) =>
                setOptions({ ...options, demolition: e.target.checked })
              }
            />
            철거 공사 포함
          </label>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">공정별 비용</h2>
        <div className="overflow-x-auto">
          {/* 휴대폰: 공정 | 예상 비용 두 칸(판정·구분·근거는 공정 아래), 넓은 화면: 다섯 칸 표 */}
          <table className="w-full border-collapse text-left text-base sm:min-w-[640px]">
            <thead>
              <tr className="border-b border-line-2 text-sm text-ink-2">
                <th className="py-2 pr-3">공정</th>
                <th className="hidden py-2 pr-3 sm:table-cell">구분</th>
                <th className="hidden py-2 pr-3 sm:table-cell">판정</th>
                <th className="py-2 pr-3 text-right">예상 비용</th>
                <th className="hidden py-2 sm:table-cell">근거</th>
              </tr>
            </thead>
            <tbody>
              {estimate.processes.map((p) => (
                <ProcessRow
                  key={p.id}
                  p={p}
                  input={estimateInput}
                  price={basis.price}
                />
              ))}
              <tr className="border-t border-line-2">
                <td className="py-2 pr-3 sm:hidden">
                  공정 소계 · 지역계수{" "}
                  {basis.price.regionFactors[estimateInput.region]}
                </td>
                <td className="hidden py-2 pr-3 sm:table-cell" colSpan={3}>
                  공정 소계 · 지역계수{" "}
                  {basis.price.regionFactors[estimateInput.region]}
                </td>
                <td className="py-2 pr-3 text-right">
                  {manwon(estimate.subtotal)}
                </td>
                <td className="hidden sm:table-cell" />
              </tr>
              <tr>
                <td className="py-2 pr-3 sm:hidden">예비비</td>
                <td className="hidden py-2 pr-3 sm:table-cell" colSpan={3}>
                  예비비
                </td>
                <td className="py-2 pr-3 text-right">
                  {manwon(estimate.contingency)}
                </td>
                <td className="hidden py-2 text-sm text-ink-2 sm:table-cell">
                  공정 소계의 {pctp(basis.price.contingencyRate)}
                </td>
              </tr>
              <tr className="border-t-2 border-ink font-semibold">
                <td className="py-2 pr-3 sm:hidden">합계</td>
                <td className="hidden py-2 pr-3 sm:table-cell" colSpan={3}>
                  합계
                </td>
                <td className="py-2 pr-3 text-right">
                  {manwon(estimate.total)}
                </td>
                <td className="hidden sm:table-cell" />
              </tr>
            </tbody>
          </table>
        </div>
        {estimate.unpricedProcesses.length > 0 && (
          <p className={notice}>
            단가 확정 전이라 견적에서 빠진 공정:{" "}
            {estimate.unpricedProcesses
              .map((id) => PROCESS_LABELS[id])
              .join(", ")}
            . 현장진단에서 확인합니다.
          </p>
        )}
        {missingLabels.length > 0 && (
          <p className={notice}>
            <b>현장 확인 필요</b> — 사진이 없는 부위: {missingLabels.join(", ")}
          </p>
        )}
      </section>

      <section className={card}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">숙박 영업 간이 확인</h2>
          <span className="text-sm text-ink-2">법적 판정 아님</span>
        </div>
        <p className="text-sm text-ink-2">{PERMIT_DISCLAIMER}</p>
        <ul className="flex flex-col gap-2">
          {permitItems(
            estimateInput.noRegistry,
            computation.site,
            permitContent,
          ).map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-1 border-b border-line pb-2 last:border-0"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone="warn">{PERMIT_STATUS_LABELS[item.status]}</Pill>
                <span className="text-base">{item.title}</span>
              </div>
              <span className="text-sm text-ink-2">{item.nextAction}</span>
              {item.agency && (
                <span className="text-sm text-ink-2">문의: {item.agency}</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <Disclaimer
        priceVersion={basis.price.version}
        provisional={basis.provisional}
      />

      <div className="flex flex-wrap justify-between gap-3">
        <button
          type="button"
          className={btnSecondary}
          onClick={() => go("checklist")}
        >
          이전
        </button>
        <button
          type="button"
          className={expertRequired ? btnSecondary : btnPrimary}
          disabled={busy}
          onClick={toRevenue}
        >
          {expertRequired
            ? "그래도 수익 시뮬레이션 보기"
            : "수익 시뮬레이션 보기"}
        </button>
      </div>
    </div>
  );
}

function ProcessRow({
  p,
  input,
  price,
}: {
  p: ProcessCost;
  input: EstimateInput;
  price: PriceTable;
}) {
  const def = price.processes[p.id];
  const kind =
    p.baseCost > 0 && p.repairCost > 0
      ? "기본 공사 + 상태별 보수"
      : p.baseCost > 0
        ? "기본 공사"
        : "상태별 보수";
  const qty = (() => {
    switch (def?.quantityBasis) {
      case "floorArea":
        return `연면적 ${input.floorArea}㎡`;
      case "roofArea":
        return input.floors && input.floors > 1
          ? `지붕 연면적 ${input.floorArea}㎡ ÷ ${input.floors}층 × ${price.roofAreaFactor}`
          : `지붕 ${input.floorArea}㎡ × ${price.roofAreaFactor}`;
      case "bathrooms":
        return `욕실 ${input.bathrooms}개`;
      case "kitchens":
        return `주방 ${input.kitchens}개`;
      default:
        return "1식";
    }
  })();
  const baseUnit =
    p.id === "interior"
      ? price.moduleUnitPrices[input.module]
      : def?.baseUnitPrice;
  const grade =
    p.repairCost > 0 || p.grade !== "good" ? (
      <span className={`rounded px-2 py-0.5 text-sm ${GRADE_STYLE[p.grade]}`}>
        {GRADE_LABEL[p.grade]}
      </span>
    ) : null;
  const basisDetails = (
    <details>
      <summary className="min-h-11 cursor-pointer py-2">ⓘ 근거</summary>
      <ul className="flex flex-col gap-1 pb-2">
        <li>기준수량: {qty}</li>
        {p.baseCost > 0 && baseUnit !== undefined && (
          <li>기본 단가 {baseUnit.toLocaleString("ko-KR")}원</li>
        )}
        {p.repairCost > 0 && def?.repairUnitPrice !== undefined && (
          <li>
            보수 단가 {def.repairUnitPrice.toLocaleString("ko-KR")}원 × 상태계수{" "}
            {price.conditionCoefficients[p.grade]} (체크리스트 판정)
          </li>
        )}
        <li>작업일 {Math.ceil(p.days)}일</li>
        <li>단가 DB {price.version}</li>
        {p.id === "iot" && (
          <li>설치비만 추정 · 자동 연동·관제는 Phase 2 이후</li>
        )}
      </ul>
    </details>
  );
  return (
    <tr className="border-b border-line align-top">
      <td className="py-2 pr-3">
        {PROCESS_LABELS[p.id]}
        {p.id === "interior" && ` (모듈 ${input.module})`}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-sm text-ink-2 sm:hidden">
          {grade}
          <span>{kind}</span>
        </div>
        <div className="text-sm text-ink-2 sm:hidden">{basisDetails}</div>
      </td>
      <td className="hidden py-2 pr-3 text-sm sm:table-cell">{kind}</td>
      <td className="hidden py-2 pr-3 sm:table-cell">{grade ?? "–"}</td>
      <td className="py-2 pr-3 text-right whitespace-nowrap">
        {manwon(p.cost)}
      </td>
      <td className="hidden py-2 text-sm text-ink-2 sm:table-cell">
        {basisDetails}
      </td>
    </tr>
  );
}
