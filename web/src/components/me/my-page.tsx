"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthUser } from "@/lib/auth/use-auth-user";
import {
  CONSULT_STAGE_LABELS,
  CONSULT_TYPE_LABELS,
} from "@/lib/consult/status";
import { listMyConsultations, type Consultation } from "@/lib/consult/store";
import {
  diagnosisCode,
  listMyAssessments,
  type Assessment,
  type AssessmentStatus,
} from "@/lib/diagnosis/store";
import { manwon } from "@/components/diagnose/estimate-step";
import { card } from "@/components/diagnose/styles";

const STATUS_LABEL: Record<AssessmentStatus, string> = {
  draft: "입력 중",
  saved: "견적 완료",
  consult: "상담 신청",
  expertRequired: "전문가 진단 필요",
};
const STATUS_STYLE: Record<AssessmentStatus, string> = {
  draft: "bg-surface-2 text-ink-2",
  saved: "bg-good-soft text-good",
  consult: "bg-info-soft text-info",
  expertRequired: "bg-crit-soft text-crit",
};

const linkBtn =
  "inline-flex h-12 items-center rounded-lg border border-line-2 bg-surface px-4 text-base";

// 마이페이지 (COM-03, task.md 8.2). 리포트 다시 보기는 저장된 스냅샷으로 연다(재계산 아님).
export function MyPage() {
  const uid = useAuthUser()?.uid;
  const [assessments, setAssessments] = useState<Assessment[] | null>(null);
  const [consults, setConsults] = useState<Consultation[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    Promise.all([listMyAssessments(uid), listMyConsultations(uid)])
      .then(([a, c]) => {
        if (cancelled) return;
        setAssessments(a);
        setConsults(c);
      })
      .catch(() => !cancelled && setError("목록을 불러오지 못했습니다."));
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const codeOf = (id: string | null) => (id ? diagnosisCode(id) : null);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">마이페이지</h1>
        <Link href="/diagnose" className={linkBtn}>
          새 진단 시작
        </Link>
      </div>
      {error && <p className="text-base text-crit">{error}</p>}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">내 진단</h2>
        {!assessments ? (
          <p className="text-base">불러오는 중…</p>
        ) : assessments.length === 0 ? (
          <p className="text-base text-muted">아직 진단이 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {assessments.map((a) => (
              <li key={a.id} className={card}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-ink-2">
                    {diagnosisCode(a.id)}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-sm ${STATUS_STYLE[a.status]}`}
                  >
                    {STATUS_LABEL[a.status]}
                  </span>
                  <span className="text-sm text-ink-2">
                    {a.createdAt?.toLocaleDateString("ko-KR") ?? ""}
                  </span>
                </div>
                <span className="text-base font-semibold">
                  {a.address ?? "주소 입력 전"}
                </span>
                {a.latestSummary && (
                  <span className="text-base">
                    견적 {manwon(a.latestSummary.total)} · 월 추정액(기본안){" "}
                    {manwon(a.latestSummary.baseNet)}
                  </span>
                )}
                <div className="flex flex-wrap gap-2">
                  {a.latestSnapshotId && (
                    <Link
                      href={`/report/${a.id}/${a.latestSnapshotId}`}
                      className={linkBtn}
                    >
                      리포트 다시 보기
                    </Link>
                  )}
                  <Link
                    href={`/diagnose/${a.id}/${a.reached}`}
                    className={linkBtn}
                  >
                    {a.status === "draft" ? "이어서 하기" : "결과·입력 보기"}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">상담 신청 내역</h2>
        {!consults ? (
          <p className="text-base">불러오는 중…</p>
        ) : consults.length === 0 ? (
          <p className="text-base text-muted">아직 상담 신청이 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {consults.map((c) => (
              <li key={c.id} className={card}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-semibold">
                    {CONSULT_TYPE_LABELS[c.type]}
                  </span>
                  <span className="rounded bg-info-soft px-2 py-0.5 text-sm text-info">
                    {CONSULT_STAGE_LABELS[c.status]}
                  </span>
                </div>
                <span className="text-sm text-ink-2">
                  신청 {c.createdAt?.toLocaleDateString("ko-KR") ?? ""}
                  {codeOf(c.assessmentId) &&
                    ` · 진단 ${codeOf(c.assessmentId)}`}
                  {c.assigneeName && ` · 담당 ${c.assigneeName}`}
                </span>
                {c.assessmentId && c.snapshotId && (
                  <div>
                    <Link
                      href={`/report/${c.assessmentId}/${c.snapshotId}`}
                      className={linkBtn}
                    >
                      신청 당시 리포트
                    </Link>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
