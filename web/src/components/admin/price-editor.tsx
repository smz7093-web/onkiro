"use client";

import { useState } from "react";
import {
  calculateEstimate,
  EstimateInputError,
  roundForDisplay,
} from "@/lib/engine/estimate";
import {
  REFERENCE_ESTIMATE,
  REFERENCE_ESTIMATE_INPUT,
} from "@/lib/engine/reference";
import {
  PROCESS_IDS,
  PROCESS_LABELS,
  type ConditionGrade,
  type ModuleType,
  type PriceTable,
  type ProcessId,
  type ProcessPrice,
  type QuantityBasis,
} from "@/lib/engine/types";
import { RECOMMENDED_PROCESS_PRICES } from "@/lib/engine/defaults";
import { ChecklistRulesEditor } from "./checklist-rules-editor";
import { man } from "./format";
import { NumberField } from "./number-field";
import { DTag } from "./d-tag";

const BASIS_LABEL: Record<QuantityBasis, string> = {
  floorArea: "연면적(㎡)",
  roofArea: "지붕면적(㎡)",
  bathrooms: "욕실 개수",
  kitchens: "주방 개수",
  lumpSum: "1식",
};
const GRADE_LABEL: Record<ConditionGrade, string> = {
  good: "양호",
  partial: "부분 보수",
  full: "전면 교체",
};

// 단가 DB 편집 (ADM-01, 목업 adm-price-db)
export function PriceEditor({
  data,
  setData,
  readOnly,
}: {
  data: PriceTable;
  setData: (next: PriceTable) => void;
  readOnly: boolean;
}) {
  const [newRegion, setNewRegion] = useState("");

  const setProcess = (id: ProcessId, patch: Partial<ProcessPrice> | null) => {
    const processes = { ...data.processes };
    if (patch === null) delete processes[id];
    else
      processes[id] = {
        ...(processes[id] ?? { quantityBasis: "floorArea" }),
        ...patch,
      };
    setData({ ...data, processes });
  };
  const num = (v: number | undefined) => v ?? 0;
  const input =
    "h-10 w-28 rounded-md border border-zinc-300 bg-white px-2 text-right text-base text-ink read-only:bg-zinc-50";

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">
          공정별 단가 <DTag ids={["D5"]} />
        </h2>
        <p className="text-sm text-zinc-600">
          공정별 비용 = 기준수량 × 기본 단가 + 기준수량 × 보수 단가 × 상태계수.
          내부 리모델링의 기본 단가는 아래 모듈 단가를 씁니다.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left text-base">
            <thead>
              <tr className="border-b border-zinc-300 text-sm text-zinc-600">
                <th className="py-2 pr-3">공정</th>
                <th className="py-2 pr-3">기준수량</th>
                <th className="py-2 pr-3">기본 공사</th>
                <th className="py-2 pr-3">기본 단가(원)</th>
                <th className="py-2 pr-3">보수 단가(원)</th>
                <th className="py-2 pr-3">기본 작업일</th>
                <th className="py-2 pr-3">보수 기준일</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {PROCESS_IDS.map((id) => {
                const p = data.processes[id];
                if (!p) {
                  return (
                    <tr
                      key={id}
                      className="border-b border-zinc-100 text-zinc-500"
                    >
                      <td className="py-2 pr-3">{PROCESS_LABELS[id]}</td>
                      <td className="py-2 pr-3" colSpan={6}>
                        단가 없음 (견적에서 빠짐)
                      </td>
                      <td className="py-2">
                        {!readOnly && (
                          <button
                            type="button"
                            className="text-sm underline"
                            onClick={() =>
                              setProcess(id, { quantityBasis: "floorArea" })
                            }
                          >
                            추가
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                }
                const field = (key: keyof ProcessPrice, disabled = false) => (
                  <input
                    type="number"
                    aria-label={`${PROCESS_LABELS[id]} ${key}`}
                    className={input}
                    readOnly={readOnly || disabled}
                    value={
                      disabled ? "" : ((p[key] as number | undefined) ?? "")
                    }
                    placeholder={disabled ? "모듈 단가" : "–"}
                    onChange={(e) =>
                      setProcess(id, {
                        [key]:
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value),
                      })
                    }
                  />
                );
                return (
                  <tr key={id} className="border-b border-zinc-100">
                    <td className="py-2 pr-3">{PROCESS_LABELS[id]}</td>
                    <td className="py-2 pr-3">
                      <select
                        aria-label={`${PROCESS_LABELS[id]} 기준수량`}
                        className="h-10 rounded-md border border-zinc-300 px-2 text-base disabled:bg-zinc-50"
                        disabled={readOnly}
                        value={p.quantityBasis}
                        onChange={(e) =>
                          setProcess(id, {
                            quantityBasis: e.target.value as QuantityBasis,
                          })
                        }
                      >
                        {Object.entries(BASIS_LABEL).map(([k, label]) => (
                          <option key={k} value={k}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-3">
                      <select
                        aria-label={`${PROCESS_LABELS[id]} 기본 공사`}
                        className="h-10 rounded-md border border-zinc-300 px-2 text-base disabled:bg-zinc-50"
                        disabled={readOnly}
                        value={p.baseApplies ?? "none"}
                        onChange={(e) =>
                          setProcess(id, {
                            baseApplies:
                              e.target.value === "none"
                                ? undefined
                                : (e.target.value as "always" | "optional"),
                          })
                        }
                      >
                        <option value="none">없음</option>
                        <option value="always">항상</option>
                        <option value="optional">선택 시</option>
                      </select>
                    </td>
                    <td className="py-2 pr-3">
                      {field("baseUnitPrice", id === "interior")}
                    </td>
                    <td className="py-2 pr-3">{field("repairUnitPrice")}</td>
                    <td className="py-2 pr-3">{field("baseDays")}</td>
                    <td className="py-2 pr-3">{field("repairDays")}</td>
                    <td className="py-2">
                      {!readOnly && (
                        <button
                          type="button"
                          className="text-sm text-red-700 underline"
                          onClick={() => setProcess(id, null)}
                        >
                          빼기
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!readOnly && (
          <div>
            <button
              type="button"
              className="h-11 rounded-lg border border-accent px-4 text-base text-accent"
              onClick={() => {
                const empty = (
                  Object.keys(RECOMMENDED_PROCESS_PRICES) as ProcessId[]
                ).filter((id) => !data.processes[id]);
                if (empty.length === 0) {
                  window.alert(
                    "권장 단가가 있는 공정은 이미 모두 입력되어 있습니다.",
                  );
                  return;
                }
                const names = empty.map((id) => PROCESS_LABELS[id]).join(", ");
                if (
                  !window.confirm(
                    `비어 있는 공정(${names})에 권장 단가(팀원결정권장안.md D5)를 넣습니다. 이미 입력한 공정은 그대로 둡니다. 저장해야 초안에 들어갑니다.`,
                  )
                )
                  return;
                const processes = { ...data.processes };
                for (const id of empty)
                  processes[id] = { ...RECOMMENDED_PROCESS_PRICES[id]! };
                setData({ ...data, processes });
              }}
            >
              빈 공정에 권장 단가 채우기
            </button>
          </div>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <h2 className="text-lg font-semibold sm:col-span-3">
          내부 리모델링 모듈 단가 (원/㎡) <DTag ids={["D3", "D5"]} />
        </h2>
        {(["A", "B", "C"] as ModuleType[]).map((m) => (
          <NumberField
            key={m}
            label={`모듈 ${m}`}
            unit="원/㎡"
            readOnly={readOnly}
            value={data.moduleUnitPrices[m]}
            onChange={(v) =>
              setData({
                ...data,
                moduleUnitPrices: { ...data.moduleUnitPrices, [m]: num(v) },
              })
            }
          />
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <h2 className="text-lg font-semibold sm:col-span-3">
          상태계수 (보수비에만 곱함) <DTag ids={["D5"]} />
        </h2>
        {(["good", "partial", "full"] as ConditionGrade[]).map((g) => (
          <NumberField
            key={g}
            label={GRADE_LABEL[g]}
            readOnly={readOnly}
            value={data.conditionCoefficients[g]}
            onChange={(v) =>
              setData({
                ...data,
                conditionCoefficients: {
                  ...data.conditionCoefficients,
                  [g]: num(v),
                },
              })
            }
          />
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-4">
        <h2 className="text-lg font-semibold sm:col-span-4">
          예비비·공기·범위 <DTag ids={["D5"]} />
        </h2>
        <NumberField
          label="예비비"
          percent
          readOnly={readOnly}
          value={data.contingencyRate}
          onChange={(v) => setData({ ...data, contingencyRate: num(v) })}
        />
        <NumberField
          label="지붕면적 계수"
          hint="지붕면적 = 연면적 × 계수"
          readOnly={readOnly}
          value={data.roofAreaFactor}
          onChange={(v) => setData({ ...data, roofAreaFactor: num(v) })}
        />
        <NumberField
          label="공기 고정일"
          unit="일"
          hint="착공 준비·준공 점검"
          readOnly={readOnly}
          value={data.fixedDays}
          onChange={(v) => setData({ ...data, fixedDays: num(v) })}
        />
        <NumberField
          label="범위 반올림 단위"
          unit="원"
          readOnly={readOnly}
          value={data.rangeRoundingUnit}
          onChange={(v) => setData({ ...data, rangeRoundingUnit: num(v) })}
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-4">
        <h2 className="text-lg font-semibold sm:col-span-4">
          불확실도 (범위 = 합계 × (1 ± 불확실도)) <DTag ids={["D5"]} />
        </h2>
        <NumberField
          label="기본"
          percent
          readOnly={readOnly}
          value={data.uncertainty.base}
          onChange={(v) =>
            setData({
              ...data,
              uncertainty: { ...data.uncertainty, base: num(v) },
            })
          }
        />
        <NumberField
          label="사진 누락 부위당"
          percent
          readOnly={readOnly}
          value={data.uncertainty.perMissingPhotoPart}
          onChange={(v) =>
            setData({
              ...data,
              uncertainty: { ...data.uncertainty, perMissingPhotoPart: num(v) },
            })
          }
        />
        <NumberField
          label="대장 없음"
          percent
          readOnly={readOnly}
          value={data.uncertainty.noRegistry}
          onChange={(v) =>
            setData({
              ...data,
              uncertainty: { ...data.uncertainty, noRegistry: num(v) },
            })
          }
        />
        <NumberField
          label="'모름' 응답당"
          percent
          hint="D5 확정 전 임시 0"
          readOnly={readOnly}
          value={data.uncertainty.perUnknownAnswer}
          onChange={(v) =>
            setData({
              ...data,
              uncertainty: { ...data.uncertainty, perUnknownAnswer: num(v) },
            })
          }
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">
          지역계수 <DTag ids={["D5"]} />
        </h2>
        <div className="grid gap-4 sm:grid-cols-4">
          {Object.entries(data.regionFactors).map(([region, factor]) => (
            <NumberField
              key={region}
              label={region}
              readOnly={readOnly}
              value={factor}
              onChange={(v) =>
                setData({
                  ...data,
                  regionFactors: { ...data.regionFactors, [region]: num(v) },
                })
              }
            />
          ))}
        </div>
        {!readOnly && (
          <div className="flex items-end gap-2">
            <label className="flex flex-col gap-1 text-sm text-zinc-700">
              지역 추가 (영문 코드)
              <input
                className="h-10 rounded-md border border-zinc-300 px-2 text-base"
                value={newRegion}
                onChange={(e) => setNewRegion(e.target.value.trim())}
              />
            </label>
            <button
              type="button"
              className="h-10 rounded-md border border-zinc-300 px-3 text-sm"
              disabled={
                !/^[a-z][a-z0-9-]*$/.test(newRegion) ||
                newRegion in data.regionFactors
              }
              onClick={() => {
                setData({
                  ...data,
                  regionFactors: { ...data.regionFactors, [newRegion]: 1 },
                });
                setNewRegion("");
              }}
            >
              추가
            </button>
          </div>
        )}
      </section>

      <ChecklistRulesEditor
        rules={data.checklistRules}
        setRules={(checklistRules) => setData({ ...data, checklistRules })}
        readOnly={readOnly}
      />

      <PriceCheck data={data} />
    </div>
  );
}

// 검증 사례: 대표 예시(72㎡ 목구조·모듈 B)를 이 단가로 계산해 PRD 기준값과 비교한다
function PriceCheck({ data }: { data: PriceTable }) {
  // 계산만 try 안에서 하고, 화면은 밖에서 그린다 (렌더링 오류는 try/catch로 잡히지 않는다)
  let rows: [string, string, string, boolean][] | null = null;
  let failure: string | null = null;
  try {
    const r = calculateEstimate(REFERENCE_ESTIMATE_INPUT, data);
    rows = [
      [
        "공정 소계",
        man(roundForDisplay(r.subtotal)),
        man(REFERENCE_ESTIMATE.subtotal),
        roundForDisplay(r.subtotal) === REFERENCE_ESTIMATE.subtotal,
      ],
      [
        "합계 (예비비 포함)",
        man(roundForDisplay(r.total)),
        man(REFERENCE_ESTIMATE.total),
        roundForDisplay(r.total) === REFERENCE_ESTIMATE.total,
      ],
      [
        "범위",
        `${man(r.rangeLow)} ~ ${man(r.rangeHigh)}`,
        `${man(REFERENCE_ESTIMATE.rangeLow)} ~ ${man(REFERENCE_ESTIMATE.rangeHigh)}`,
        r.rangeLow === REFERENCE_ESTIMATE.rangeLow &&
          r.rangeHigh === REFERENCE_ESTIMATE.rangeHigh,
      ],
      [
        "공기",
        `${r.days}일`,
        `${REFERENCE_ESTIMATE.days}일`,
        r.days === REFERENCE_ESTIMATE.days,
      ],
    ];
  } catch (e) {
    failure = e instanceof EstimateInputError ? e.message : String(e);
  }
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4">
      <h2 className="text-lg font-semibold">검증 사례 · 대표 예시</h2>
      <p className="text-sm text-zinc-600">
        72㎡ 목구조·모듈 B, 지붕·구조 부분 보수, 욕실·주방 전면 교체 (prd.md
        7.1). 단가를 바꾸면 결과가 기준값과 달라질 수 있으며, 확정 단가로 바꿀
        때는 PRD 기준값도 함께 고칩니다 (task.md 5.6).
      </p>
      {rows ? (
        <CheckTable rows={rows} />
      ) : (
        <p role="alert" className="text-sm text-red-700">
          계산할 수 없습니다: {failure}
        </p>
      )}
    </section>
  );
}

export function CheckTable({
  rows,
}: {
  rows: [string, string, string, boolean][];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] border-collapse text-left text-base">
        <thead>
          <tr className="border-b border-zinc-300 text-sm text-zinc-600">
            <th className="py-2 pr-4">항목</th>
            <th className="py-2 pr-4">이 버전</th>
            <th className="py-2 pr-4">PRD 기준값</th>
            <th className="py-2">결과</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, actual, expected, ok]) => (
            <tr key={label} className="border-b border-zinc-100">
              <td className="py-2 pr-4">{label}</td>
              <td className="py-2 pr-4">{actual}</td>
              <td className="py-2 pr-4 text-zinc-600">{expected}</td>
              <td className="py-2">
                <span
                  className={`rounded px-2 py-0.5 text-sm ${ok ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`}
                >
                  {ok ? "일치" : "다름"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
