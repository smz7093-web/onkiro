"use client";

import {
  REFERENCE_INVESTMENT,
  REFERENCE_REVENUE,
} from "@/lib/engine/reference";
import { calculateScenarios, RevenueInputError } from "@/lib/engine/revenue";
import type {
  AssumptionSet,
  RevenueInput,
  ScenarioId,
} from "@/lib/engine/types";
import { NumberField } from "./number-field";
import { CheckTable } from "./price-editor";

// 수익 입력 13개의 표시 방법 (prd.md 7.2)
const FIELDS: {
  key: keyof RevenueInput;
  label: string;
  unit?: string;
  percent?: boolean;
  hint?: string;
}[] = [
  { key: "weekdayPrice", label: "평일가", unit: "원" },
  { key: "weekendPrice", label: "주말가", unit: "원" },
  {
    key: "occupancy",
    label: "연평균 가동률",
    percent: true,
    hint: "계산에 쓰는 값",
  },
  { key: "unavailableDays", label: "월 판매 불가일", unit: "일" },
  { key: "otaFeeRate", label: "OTA 수수료율", percent: true },
  { key: "otaShare", label: "OTA 경유 비중", percent: true },
  { key: "avgStayNights", label: "평균 숙박일수", unit: "박" },
  { key: "cleaningCostPerTurn", label: "청소·소모품 (회당)", unit: "원" },
  { key: "utilities", label: "공과금 (월)", unit: "원" },
  { key: "rent", label: "임차료·소유주 배분 (월)", unit: "원" },
  { key: "insuranceMaintenance", label: "보험·유지보수 적립 (월)", unit: "원" },
  { key: "ancillaryRate", label: "부가매출 비율", percent: true },
  { key: "otherInitialInvestment", label: "기타 초기 투자금", unit: "원" },
];

const SCENARIO_LABEL: Record<ScenarioId, string> = {
  conservative: "보수",
  base: "기본",
  optimistic: "낙관",
};

// 가정값 편집 (ADM-02, 목업 adm-assume)
export function AssumptionEditor({
  data,
  setData,
  readOnly,
}: {
  data: AssumptionSet;
  setData: (next: AssumptionSet) => void;
  readOnly: boolean;
}) {
  const num = (v: number | undefined) => v ?? 0;
  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-4 sm:grid-cols-3">
        <h2 className="text-lg font-semibold sm:col-span-3">
          지역{" "}
          <span className="font-mono text-base font-normal">{data.region}</span>{" "}
          · 수익 기본값
        </h2>
        {FIELDS.map((f) => (
          <NumberField
            key={f.key}
            label={f.label}
            unit={f.unit}
            percent={f.percent}
            hint={f.hint}
            readOnly={readOnly}
            value={data.defaults[f.key]}
            onChange={(v) =>
              setData({
                ...data,
                defaults: { ...data.defaults, [f.key]: num(v) },
              })
            }
          />
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-4">
        <h2 className="text-lg font-semibold sm:col-span-4">
          3안 비교 · 가동률 입력 범위
        </h2>
        <NumberField
          label="보수안 편차"
          percent
          hint="예: −15 (%p)"
          readOnly={readOnly}
          value={data.scenarioDeltas.conservative}
          onChange={(v) =>
            setData({
              ...data,
              scenarioDeltas: { ...data.scenarioDeltas, conservative: num(v) },
            })
          }
        />
        <NumberField
          label="낙관안 편차"
          percent
          hint="예: 10 (%p)"
          readOnly={readOnly}
          value={data.scenarioDeltas.optimistic}
          onChange={(v) =>
            setData({
              ...data,
              scenarioDeltas: { ...data.scenarioDeltas, optimistic: num(v) },
            })
          }
        />
        <NumberField
          label="기본안 가동률 하한"
          percent
          readOnly={readOnly}
          value={data.occupancyRange.min}
          onChange={(v) =>
            setData({
              ...data,
              occupancyRange: { ...data.occupancyRange, min: num(v) },
            })
          }
        />
        <NumberField
          label="기본안 가동률 상한"
          percent
          readOnly={readOnly}
          value={data.occupancyRange.max}
          onChange={(v) =>
            setData({
              ...data,
              occupancyRange: { ...data.occupancyRange, max: num(v) },
            })
          }
        />
        <p className="text-xs text-zinc-500 sm:col-span-4">
          하한 + 보수안 편차는 10% 이상, 상한 + 낙관안 편차는 95% 이하여야
          적용할 수 있습니다.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <h2 className="text-lg font-semibold sm:col-span-2">
          근거 표시용 (계산에 쓰지 않음)
        </h2>
        <NumberField
          label="성수기 가동률"
          percent
          readOnly={readOnly}
          value={data.seasonalOccupancy?.peak}
          onChange={(v) =>
            setData({
              ...data,
              seasonalOccupancy: {
                offPeak: data.seasonalOccupancy?.offPeak ?? 0,
                peak: num(v),
              },
            })
          }
        />
        <NumberField
          label="비수기 가동률"
          percent
          readOnly={readOnly}
          value={data.seasonalOccupancy?.offPeak}
          onChange={(v) =>
            setData({
              ...data,
              seasonalOccupancy: {
                peak: data.seasonalOccupancy?.peak ?? 0,
                offPeak: num(v),
              },
            })
          }
        />
      </section>

      <AssumptionCheck data={data} />
    </div>
  );
}

// 검증 사례: 이 가정값의 기본값으로 3안을 계산해 PRD 수익 검증표와 비교한다 (총투자금 3,300만 원)
function AssumptionCheck({ data }: { data: AssumptionSet }) {
  const manRound = (won: number) => Math.round(won / 10_000);
  // 계산만 try 안에서 하고, 화면은 밖에서 그린다 (렌더링 오류는 try/catch로 잡히지 않는다)
  const rows: [string, string, string, boolean][] = [];
  let failure: string | null = null;
  try {
    const s = calculateScenarios(data.defaults, REFERENCE_INVESTMENT, data);
    for (const id of ["conservative", "base", "optimistic"] as ScenarioId[]) {
      const r = s[id];
      const ref = REFERENCE_REVENUE[id];
      const tag = `${SCENARIO_LABEL[id]} ${Math.round(r.occupancy * 100)}%`;
      const payback =
        r.paybackMonths === null ? null : Math.round(r.paybackMonths);
      const bep =
        r.breakEvenOccupancy === null
          ? null
          : Math.round(r.breakEvenOccupancy * 100);
      rows.push(
        [
          `${tag} · 월 매출`,
          `${manRound(r.revenue)}만`,
          `${ref.revenue}만`,
          manRound(r.revenue) === ref.revenue,
        ],
        [
          `${tag} · 월 운영비`,
          `${manRound(r.operatingCost)}만`,
          `${ref.operatingCost}만`,
          manRound(r.operatingCost) === ref.operatingCost,
        ],
        [
          `${tag} · 차감 후 추정액`,
          `${manRound(r.net)}만`,
          `${ref.net}만`,
          manRound(r.net) === ref.net,
        ],
        [
          `${tag} · 회수 기간`,
          payback === null ? "회수 불가" : `${payback}개월`,
          `${ref.paybackMonths}개월`,
          payback === ref.paybackMonths,
        ],
        [
          `${tag} · BEP 가동률`,
          bep === null ? "–" : `${bep}%`,
          `${ref.bep}%`,
          bep === ref.bep,
        ],
      );
    }
  } catch (e) {
    failure = e instanceof RevenueInputError ? e.message : String(e);
  }
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4">
      <h2 className="text-lg font-semibold">검증 사례 · 수익 검증표</h2>
      <p className="text-sm text-zinc-600">
        총투자금 3,300만 원으로 이 버전의 기본값을 계산합니다 (prd.md 7.2). 확정
        가정값으로 바꿀 때는 PRD 기준값도 함께 고칩니다 (task.md 5.6).
      </p>
      {failure ? (
        <p role="alert" className="text-sm text-red-700">
          계산할 수 없습니다: {failure}
        </p>
      ) : (
        <CheckTable rows={rows} />
      )}
    </section>
  );
}
