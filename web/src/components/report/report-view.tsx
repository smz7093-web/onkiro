"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RISK_FLAG_LABELS } from "@/lib/engine/checklist";
import {
  PROCESS_LABELS,
  type ConditionGrade,
  type RevenueInput,
} from "@/lib/engine/types";
import {
  PERMIT_DISCLAIMER,
  PERMIT_STATUS_LABELS,
  permitItems,
} from "@/lib/diagnosis/permits";
import {
  getSnapshot,
  type StoredSnapshot,
} from "@/lib/diagnosis/snapshot-store";
import {
  diagnosisCode,
  getAssessment,
  type Assessment,
} from "@/lib/diagnosis/store";
import { manwon } from "@/components/diagnose/estimate-step";
import { ScenarioTable } from "@/components/diagnose/revenue-step";
import { usePermitContent } from "@/lib/site-content/store";

const GRADE_LABEL: Record<ConditionGrade, string> = {
  good: "양호",
  partial: "부분 보수",
  full: "전면 교체",
};

const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;
const pct = (r: number) => `${Math.round(r * 100)}%`;

// 리포트에 싣는 수익 가정값 13개 (SIM-12)
const REVENUE_ROWS: { label: string; show: (i: RevenueInput) => string }[] = [
  { label: "평일 1박 요금", show: (i) => won(i.weekdayPrice) },
  { label: "주말 1박 요금", show: (i) => won(i.weekendPrice) },
  { label: "가동률 (기본안)", show: (i) => pct(i.occupancy) },
  { label: "OTA 수수료율", show: (i) => pct(i.otaFeeRate) },
  { label: "월 판매 불가일", show: (i) => `${i.unavailableDays}일` },
  { label: "OTA 경유 비중", show: (i) => pct(i.otaShare) },
  { label: "평균 숙박일수", show: (i) => `${i.avgStayNights}박` },
  { label: "회당 청소비", show: (i) => won(i.cleaningCostPerTurn) },
  { label: "공과금 (월)", show: (i) => won(i.utilities) },
  { label: "임차료 (월)", show: (i) => won(i.rent) },
  { label: "보험·유지보수 (월)", show: (i) => won(i.insuranceMaintenance) },
  { label: "부가매출 비율", show: (i) => pct(i.ancillaryRate) },
  { label: "기타 초기 투자금", show: (i) => won(i.otherInitialInvestment) },
];

// PDF 리포트 (SIM-16, task.md 8.1). 저장된 스냅샷 그대로 보여주고(재계산 아님), 브라우저 인쇄로 PDF를 만든다.
export function ReportView({
  assessmentId,
  snapshotId,
}: {
  assessmentId: string;
  snapshotId: string;
}) {
  const [data, setData] = useState<{ a: Assessment; s: StoredSnapshot } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const permitContent = usePermitContent();

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getAssessment(assessmentId),
      getSnapshot(assessmentId, snapshotId),
    ])
      .then(([a, s]) => {
        if (cancelled) return;
        if (!a || !s) setError("리포트를 찾을 수 없습니다.");
        else setData({ a, s });
      })
      .catch(
        () =>
          !cancelled &&
          setError("리포트를 볼 권한이 없거나 불러오지 못했습니다."),
      );
    return () => {
      cancelled = true;
    };
  }, [assessmentId, snapshotId]);

  if (error) return <p className="p-4 text-base">{error}</p>;
  if (!data) return <p className="p-4 text-base">불러오는 중…</p>;

  const { a, s } = data;
  const { estimate, inputs, scenarios } = s;
  const ei = inputs.estimateInput;
  const at = s.createdAt ?? new Date();
  const risks = s.checklistResult.riskFlags;

  return (
    <article className="mx-auto flex w-full max-w-[210mm] flex-col gap-6 bg-white px-6 py-8 text-ink print:max-w-none print:p-0">
      <div className="flex flex-wrap justify-end gap-2 print:hidden">
        <Link
          href="/me"
          className="inline-flex h-12 items-center rounded-lg border border-line-2 px-4 text-base"
        >
          마이페이지
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex h-12 items-center rounded-lg bg-accent px-5 text-base font-semibold text-accent-ink"
        >
          PDF로 저장 (인쇄)
        </button>
      </div>
      <p className="text-sm text-ink-2 print:hidden">
        인쇄 창에서 대상(프린터)을 &lsquo;PDF로 저장&rsquo;으로, 용지를 A4로
        고르세요.
      </p>

      <header className="report-section flex flex-col gap-2 border-b-2 border-ink pb-4">
        <span className="text-sm text-ink-2">온기로 빈집 진단 리포트</span>
        <h1 className="text-2xl font-semibold">{a.address ?? "주소 없음"}</h1>
        <dl className="grid grid-cols-[7rem_1fr] gap-y-1 text-sm">
          <dt className="text-ink-2">진단 번호</dt>
          <dd>{diagnosisCode(a.id)}</dd>
          <dt className="text-ink-2">계산 기준일</dt>
          <dd>{at.toLocaleString("ko-KR")}</dd>
          <dt className="text-ink-2">적용 버전</dt>
          <dd>
            단가 {inputs.priceVersion} · 가정값 {inputs.assumptionVersion} ·
            계산식 {inputs.formulaVersion}
          </dd>
        </dl>
      </header>

      {risks.length > 0 && (
        <section className="report-section rounded-lg border-2 border-crit p-4">
          <h2 className="text-lg font-semibold text-crit">전문가 진단 필수</h2>
          <ul className="list-disc pl-5 text-base">
            {risks.map((r) => (
              <li key={r.id}>
                {RISK_FLAG_LABELS[r.id]} — {r.reason}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="report-section flex flex-col gap-3">
        <h2 className="text-lg font-semibold">1. 예상 공사비</h2>
        <p className="text-base">
          <b className="text-2xl">{manwon(estimate.total)}</b> (예비비 포함) ·
          범위 {manwon(estimate.rangeLow)} ~ {manwon(estimate.rangeHigh)} ·
          공사기간 {estimate.days}일
        </p>
        <p className="text-sm text-ink-2">
          불확실도 ±{pct(estimate.uncertainty)} — 연면적 {ei.floorArea}㎡, 욕실{" "}
          {ei.bathrooms}·주방 {ei.kitchens}, 내부 마감 모듈 {ei.module}
          {ei.missingPhotoParts > 0 &&
            `, 사진 없는 부위 ${ei.missingPhotoParts}곳(현장 확인 필요)`}
          {ei.noRegistry && ", 건축물대장 없음"}
          {ei.unknownAnswers > 0 &&
            `, 체크리스트 '모름' ${ei.unknownAnswers}개`}
        </p>
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-ink">
              <th className="py-1 pr-2">공정</th>
              <th className="py-1 pr-2">구분</th>
              <th className="py-1 pr-2">판정</th>
              <th className="py-1 text-right">예상 비용</th>
            </tr>
          </thead>
          <tbody>
            {estimate.processes.map((p) => (
              <tr key={p.id} className="border-b border-line">
                <td className="py-1 pr-2">
                  {PROCESS_LABELS[p.id]}
                  {p.id === "iot" && " (설치비만 추정)"}
                </td>
                <td className="py-1 pr-2">
                  {p.baseCost > 0 && p.repairCost > 0
                    ? "기본 공사 + 상태별 보수"
                    : p.baseCost > 0
                      ? "기본 공사"
                      : "상태별 보수"}
                </td>
                <td className="py-1 pr-2">
                  {p.repairCost > 0 ? GRADE_LABEL[p.grade] : "–"}
                </td>
                <td className="py-1 text-right">{manwon(p.cost)}</td>
              </tr>
            ))}
            <tr>
              <td className="py-1 pr-2" colSpan={3}>
                공정 소계
              </td>
              <td className="py-1 text-right">{manwon(estimate.subtotal)}</td>
            </tr>
            <tr>
              <td className="py-1 pr-2" colSpan={3}>
                예비비
              </td>
              <td className="py-1 text-right">
                {manwon(estimate.contingency)}
              </td>
            </tr>
            <tr className="border-t border-ink font-semibold">
              <td className="py-1 pr-2" colSpan={3}>
                합계
              </td>
              <td className="py-1 text-right">{manwon(estimate.total)}</td>
            </tr>
          </tbody>
        </table>
        {estimate.unpricedProcesses.length > 0 && (
          <p className="text-sm">
            단가 확정 전이라 견적에서 빠진 공정:{" "}
            {estimate.unpricedProcesses
              .map((id) => PROCESS_LABELS[id])
              .join(", ")}
          </p>
        )}
      </section>

      <section className="report-section flex flex-col gap-3">
        <h2 className="text-lg font-semibold">2. 운영 수익 (월, 3안)</h2>
        <ScenarioTable
          scenarios={scenarios}
          deltas={{
            conservative:
              scenarios.conservative.occupancy - scenarios.base.occupancy,
            optimistic:
              scenarios.optimistic.occupancy - scenarios.base.occupancy,
          }}
        />
        <p className="text-sm">
          <b>포함한 비용</b>: OTA 수수료, 청소비, 공과금, 임차료, 보험·유지보수.{" "}
          <b>제외한 비용</b>: 세금, 대출 이자 등 금융비용, 대규모 수선비. 금액은
          운영비 차감 후 추정액이며 <b>세후 순이익이 아닙니다.</b>
        </p>
        <h3 className="text-base font-semibold">적용한 가정값</h3>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3 print:grid-cols-3">
          {REVENUE_ROWS.map((r) => (
            <div
              key={r.label}
              className="flex justify-between gap-2 border-b border-line py-1"
            >
              <dt className="text-ink-2">{r.label}</dt>
              <dd>{r.show(inputs.revenueInput)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="report-section flex flex-col gap-2">
        <h2 className="text-lg font-semibold">
          3. 숙박 영업 간이 확인 (법적 판정 아님)
        </h2>
        <p className="text-sm">{PERMIT_DISCLAIMER}</p>
        <ul className="flex flex-col gap-1 text-sm">
          {permitItems(ei.noRegistry, inputs.site, permitContent).map((p) => (
            <li key={p.id}>
              [{PERMIT_STATUS_LABELS[p.status]}] {p.title} — {p.nextAction}
              {p.agency && ` (문의: ${p.agency})`}
            </li>
          ))}
        </ul>
      </section>

      <footer className="report-section border-t border-line pt-3 text-sm text-ink-2">
        이 리포트의 금액은 입력하신 정보와 기준값으로 계산한 추정치이며 실제
        공사비·수익과 다를 수 있습니다. 정확한 금액은 현장진단 후 확정됩니다.
        계산 기준일 {at.toLocaleDateString("ko-KR")} · 단가{" "}
        {inputs.priceVersion} · 가정값 {inputs.assumptionVersion} · 계산식{" "}
        {inputs.formulaVersion}
      </footer>
    </article>
  );
}
