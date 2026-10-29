"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthUser } from "@/lib/auth/use-auth-user";
import {
  CONSULT_STAGE_LABELS,
  CONSULT_TYPE_LABELS,
} from "@/lib/consult/status";
import { listMyConsultations, type Consultation } from "@/lib/consult/store";
import { MyReservations } from "./my-reservations";
import {
  deleteAssessmentAsAdmin,
  diagnosisCode,
  listMyAssessments,
  type Assessment,
  type AssessmentStatus,
} from "@/lib/diagnosis/store";
import { manwon } from "@/components/diagnose/estimate-step";
import { card } from "@/components/diagnose/styles";
import { buttonClass, Pill } from "../ui";
import { usePermissions } from "@/lib/auth/use-permissions";
import { signOutUser } from "@/lib/firebase/kakao";

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
  const user = useAuthUser();
  const uid = user?.uid;
  const { permissions } = usePermissions(user);
  const isAdmin = permissions?.role === "admin";
  const [deleting, setDeleting] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // 관리자 삭제 (견적이 나온 진단도). 두 번 확인한다
  async function removeAsAdmin(a: Assessment) {
    const code = diagnosisCode(a.id);
    if (
      !window.confirm(
        `${code} ${a.address ?? ""} 진단을 지웁니다. 스냅샷·사진·AI 결과·빈집 정보가 함께 지워지고 되돌릴 수 없습니다. 계속할까요?`,
      )
    )
      return;
    const withConsults = window.confirm(
      "이 진단에 연결된 상담 신청도 함께 지울까요? (확인 = 함께 삭제, 취소 = 상담은 남김)",
    );
    setDeleting(a.id);
    setNotice(null);
    try {
      const r = await deleteAssessmentAsAdmin(a.id, withConsults);
      setAssessments((list) => list?.filter((x) => x.id !== a.id) ?? null);
      if (withConsults)
        setConsults(
          (list) => list?.filter((c) => c.assessmentId !== a.id) ?? null,
        );
      setNotice(
        `${code}을 지웠습니다${r.deletedConsults > 0 ? ` (상담 ${r.deletedConsults}건 함께 삭제)` : ""}.`,
      );
    } catch (e) {
      setNotice(
        e instanceof Error
          ? `지우지 못했습니다: ${e.message}`
          : "지우지 못했습니다.",
      );
    } finally {
      setDeleting(null);
    }
  }
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
        <div className="flex flex-wrap gap-2">
          <Link href="/diagnose" className={linkBtn}>
            새 진단 시작
          </Link>
          {/* 로그아웃은 원래 /login 화면에만 있어 테스터가 찾기 어려웠다(10/29).
              RequireLogin이 /login으로 보내기 전에 새로 불러오기로 홈에 간다. */}
          <button
            type="button"
            onClick={async () => {
              await signOutUser();
              // 클라이언트 이동은 RequireLogin의 /login 이동과 경쟁한다.
              // eslint-disable-next-line @next/next/no-location-assign-relative-destination
              window.location.assign("/");
            }}
            className={buttonClass({ variant: "ghost" })}
          >
            로그아웃
          </button>
        </div>
      </div>
      {error && <p className="text-base text-crit">{error}</p>}
      {notice && (
        <p role="status" className="text-base">
          {notice}
        </p>
      )}

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
                  {isAdmin && (
                    <button
                      type="button"
                      className={`${buttonClass({ variant: "danger" })} ml-auto`}
                      disabled={deleting !== null}
                      onClick={() => removeAsAdmin(a)}
                    >
                      {deleting === a.id ? "지우는 중…" : "삭제(관리자)"}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {uid && <MyReservations uid={uid} />}

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
                  <Pill tone="info">{CONSULT_STAGE_LABELS[c.status]}</Pill>
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
