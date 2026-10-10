"use client";

import { useId, useMemo, useState } from "react";
import { NumberField } from "@/components/admin/number-field";
import type {
  RevenueInput,
  RevenueResult,
  ScenarioId,
} from "@/lib/engine/types";
import {
  computeScenarios,
  DEFAULT_ESTIMATE_OPTIONS,
  defaultRevenueInput,
} from "@/lib/diagnosis/compute";
import { useDiagnosis } from "./diagnosis-context";
import { Disclaimer } from "./disclaimer";
import { manwon } from "./estimate-step";
import { NextActions } from "./next-actions";
import { btnSecondary, card, notice } from "./styles";
import {
  buildPayload,
  isChecklistComplete,
  useEstimate,
  useResultBasis,
} from "./use-result";

const SCENARIOS: { id: ScenarioId; label: string }[] = [
  { id: "conservative", label: "보수" },
  { id: "base", label: "기본" },
  { id: "optimistic", label: "낙관" },
];

const pct = (r: number | null) =>
  r === null ? "–" : `${Math.round(r * 100)}%`;

// 6단계 수익 시뮬레이션·3안 (SIM-12, 13, 14, 17, task.md 7.3·7.5).
// 값을 바꾸면 바로 3안을 다시 계산한다. 슬라이더를 움직이는 동안에는 저장하지 않고,
// 저장·PDF·상담 버튼을 누를 때 입력이 바뀌었으면 스냅샷을 만든다(7.4).
export function RevenueStep() {
  const { assessment, go } = useDiagnosis();
  const { basis, error: basisError } = useResultBasis();
  const options = assessment.estimateOptions ?? DEFAULT_ESTIMATE_OPTIONS;
  const { computation, error } = useEstimate(basis, options);
  const [edited, setEdited] = useState<RevenueInput | null>(
    assessment.revenueInput,
  );
  const input =
    edited ?? (basis ? defaultRevenueInput(basis.assumption) : null);

  const result = useMemo(() => {
    if (!basis || !computation || !input) return null;
    try {
      return {
        scenarios: computeScenarios(
          input,
          computation.estimate.total,
          basis.assumption,
        ),
        error: null,
      };
    } catch (e) {
      return {
        scenarios: null,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }, [basis, computation, input]);

  const payload = useMemo(() => {
    if (
      !basis ||
      !computation ||
      !input ||
      !isChecklistComplete(assessment.checklist)
    )
      return null;
    return buildPayload(
      basis,
      computation,
      assessment.checklist,
      options,
      input,
    );
  }, [basis, computation, input, assessment.checklist, options]);

  if (basisError || error)
    return <p className={notice}>{basisError ?? error}</p>;
  if (!basis || !computation || !input || !result)
    return <p className="text-base">계산 중…</p>;

  const set = <K extends keyof RevenueInput>(key: K, value: RevenueInput[K]) =>
    setEdited({ ...input, [key]: value });
  const range = basis.assumption.occupancyRange;

  return (
    <div className="flex flex-col gap-6">
      {computation.expertRequired && (
        <p className="rounded-lg border-2 border-crit bg-crit-soft px-4 py-3 text-base">
          <b className="text-crit">전문가 진단 필수</b> — 위험 신호가 있어 아래
          수익은 참고용입니다. 현장진단을 먼저 받아 보세요.
        </p>
      )}

      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-2xl font-semibold">운영 수익 시뮬레이션</h1>
        <button
          type="button"
          className={btnSecondary}
          onClick={() => setEdited(defaultRevenueInput(basis.assumption))}
        >
          지역 기본값으로
        </button>
      </div>
      <p className="text-base text-ink-2">
        총투자금 = 예상 공사비 {manwon(computation.estimate.total)} + 기타 초기
        투자금. 가정값 {basis.assumption.version} 기준이며 값을 바꾸면 바로 다시
        계산합니다.
      </p>

      <section className={card}>
        <Slider
          label="평일 1박 요금"
          value={input.weekdayPrice}
          min={50_000}
          max={500_000}
          step={10_000}
          shown={`${input.weekdayPrice.toLocaleString("ko-KR")}원`}
          onChange={(v) => set("weekdayPrice", v)}
        />
        <Slider
          label="주말 1박 요금"
          value={input.weekendPrice}
          min={50_000}
          max={700_000}
          step={10_000}
          shown={`${input.weekendPrice.toLocaleString("ko-KR")}원`}
          onChange={(v) => set("weekendPrice", v)}
        />
        <Slider
          label="가동률 (기본안)"
          value={input.occupancy}
          min={range.min}
          max={range.max}
          step={0.01}
          shown={pct(input.occupancy)}
          onChange={(v) => set("occupancy", v)}
        />
        <Slider
          label="OTA 수수료율"
          value={input.otaFeeRate}
          min={0}
          max={0.3}
          step={0.01}
          shown={pct(input.otaFeeRate)}
          onChange={(v) => set("otaFeeRate", v)}
        />
        <Slider
          label="월 판매 불가일"
          value={input.unavailableDays}
          min={0}
          max={15}
          step={1}
          shown={`${input.unavailableDays}일`}
          onChange={(v) => set("unavailableDays", v)}
        />
        <details>
          <summary className="min-h-11 cursor-pointer py-2 text-base underline">
            운영비 가정 더 보기
          </summary>
          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            <NumberField
              label="OTA 경유 비중"
              percent
              value={input.otaShare}
              onChange={(v) => set("otaShare", v ?? 0)}
            />
            <NumberField
              label="평균 숙박일수"
              unit="박"
              value={input.avgStayNights}
              onChange={(v) => set("avgStayNights", v ?? 1)}
            />
            <NumberField
              label="회당 청소비"
              unit="원"
              value={input.cleaningCostPerTurn}
              onChange={(v) => set("cleaningCostPerTurn", v ?? 0)}
            />
            <NumberField
              label="공과금 (월)"
              unit="원"
              value={input.utilities}
              onChange={(v) => set("utilities", v ?? 0)}
            />
            <NumberField
              label="임차료 (월)"
              unit="원"
              value={input.rent}
              onChange={(v) => set("rent", v ?? 0)}
            />
            <NumberField
              label="보험·유지보수 (월)"
              unit="원"
              value={input.insuranceMaintenance}
              onChange={(v) => set("insuranceMaintenance", v ?? 0)}
            />
            <NumberField
              label="부가매출 비율"
              percent
              value={input.ancillaryRate}
              onChange={(v) => set("ancillaryRate", v ?? 0)}
            />
            <NumberField
              label="기타 초기 투자금"
              unit="원"
              value={input.otherInitialInvestment}
              onChange={(v) => set("otherInitialInvestment", v ?? 0)}
            />
          </div>
        </details>
      </section>

      {result.error ? (
        <p className={notice}>{result.error}</p>
      ) : (
        <ScenarioTable
          scenarios={result.scenarios!}
          deltas={basis.assumption.scenarioDeltas}
        />
      )}

      <p className="text-sm text-ink-2">
        <b>포함한 비용</b>: OTA 수수료, 청소비, 공과금, 임차료, 보험·유지보수.{" "}
        <b>제외한 비용</b>: 세금, 대출 이자 등 금융비용, 대규모 수선비. 표의
        금액은 <b>운영비 차감 후 추정액이며 세후 순이익이 아닙니다.</b>
      </p>

      <Disclaimer
        priceVersion={basis.price.version}
        assumptionVersion={basis.assumption.version}
        provisional={basis.provisional}
      />

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">다음으로</h2>
        <NextActions
          payload={result.error ? null : payload}
          actions={["inspection", "turnkey", "pdf", "save"]}
          primary={computation.expertRequired ? "inspection" : "turnkey"}
        />
      </section>

      <div>
        <button
          type="button"
          className={btnSecondary}
          onClick={() => go("estimate")}
        >
          견적으로 돌아가기
        </button>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  shown,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  shown: string;
  onChange: (v: number) => void;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-base">
          {label}
        </label>
        <span className="text-base font-semibold">{shown}</span>
      </div>
      <input
        id={id}
        type="range"
        className="h-11 w-full accent-[var(--color-accent)]"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function ScenarioTable({
  scenarios,
  deltas,
}: {
  scenarios: Record<ScenarioId, RevenueResult>;
  deltas: { conservative: number; optimistic: number };
}) {
  const pp = (d: number) =>
    `${d > 0 ? "+" : "−"}${Math.round(Math.abs(d) * 100)}%p`;
  const rows: { label: string; value: (r: RevenueResult) => string }[] = [
    { label: "가동률", value: (r) => pct(r.occupancy) },
    { label: "월 매출", value: (r) => manwon(r.revenue) },
    { label: "월 운영비", value: (r) => manwon(r.operatingCost) },
    { label: "운영비 차감 후 추정액 (월)", value: (r) => manwon(r.net) },
    {
      label: "투자 회수 기간",
      value: (r) =>
        r.paybackMonths === null
          ? "회수 불가"
          : `약 ${Math.round(r.paybackMonths)}개월`,
    },
    { label: "손익분기 가동률", value: (r) => pct(r.breakEvenOccupancy) },
  ];
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-left text-base">
        <thead>
          <tr className="border-b border-line-2 text-sm text-ink-2">
            <th className="py-2 pr-3" />
            {SCENARIOS.map((s) => (
              <th
                key={s.id}
                className={`py-2 pr-3 text-right ${s.id === "base" ? "text-ink" : ""}`}
              >
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-line">
              <td className="py-2 pr-3 text-sm text-ink-2">{row.label}</td>
              {SCENARIOS.map((s) => (
                <td
                  key={s.id}
                  className={`py-2 pr-3 text-right ${s.id === "base" ? "bg-accent-soft font-semibold" : ""}`}
                >
                  {row.value(scenarios[s.id])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="pt-2 text-sm text-ink-2">
        보수·낙관안은 가동률만 바꿉니다 (보수 {pp(deltas.conservative)}, 낙관{" "}
        {pp(deltas.optimistic)}).
      </p>
    </div>
  );
}
