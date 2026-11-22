"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { diagnosisCode, type Assessment } from "@/lib/diagnosis/store";
import { can } from "@/lib/permissions";
import {
  listReviewQueue,
  REVIEW_STATE_LABEL,
  reviewState,
  type ReviewState,
} from "@/lib/review/store";
import { Pill, type PillTone } from "@/components/ui";
import { man } from "./format";
import { useStaff } from "./staff-context";

const TONE: Record<ReviewState, PillTone> = {
  pending: "warn",
  stale: "warn",
  corrected: "good",
  confirmed: "good",
};

// 진단 검수 목록 (ADM-03, task.md 11.4). 견적이 나온 진단 전부, 검수할 것·상담·전문가 확인 필요를 위로
export function ReviewList() {
  const { permissions } = useStaff();
  const allowed = can(permissions, "canReviewDiagnosis");
  const [list, setList] = useState<Assessment[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    listReviewQueue()
      .then((l) => !cancelled && setList(l))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [allowed]);

  if (!allowed)
    return (
      <p role="alert" className="text-base">
        진단 검수는 &lsquo;진단 보정&rsquo; 권한이 있는 담당자만 할 수 있습니다.
      </p>
    );

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">진단 검수</h1>
      <p className="text-base text-ink-2">
        견적이 나온 진단입니다. 사진과 체크리스트를 보고 공정별 판정·금액을
        고치면 새 견적이 저장되고 원래 자동 견적도 남습니다. 보정한 견적은
        회원의 마이페이지·리포트에도 보입니다.
      </p>
      {error ? (
        <p role="alert" className="text-base">
          목록을 불러오지 못했습니다.
        </p>
      ) : !list ? (
        <p className="text-base">불러오는 중…</p>
      ) : list.length === 0 ? (
        <p className="text-base text-ink-2">견적이 나온 진단이 없습니다.</p>
      ) : (
        <ul className="flex flex-col">
          {list.map((a) => {
            const st = reviewState(a);
            return (
              <li key={a.id} className="border-b border-line">
                <Link
                  href={`/admin/reviews/${a.id}`}
                  className="flex min-h-12 flex-wrap items-center gap-2 px-1 py-2 text-base hover:bg-surface-2"
                >
                  <Pill tone={TONE[st]}>{REVIEW_STATE_LABEL[st]}</Pill>
                  <span className="font-mono text-sm">
                    {diagnosisCode(a.id)}
                  </span>
                  <span className="flex-1">{a.address ?? "주소 입력 전"}</span>
                  {a.status === "consult" && (
                    <Pill tone="accent">상담 연결</Pill>
                  )}
                  {a.status === "expertRequired" && (
                    <Pill tone="crit">전문가 확인 필요</Pill>
                  )}
                  {a.latestSummary && (
                    <span className="text-sm text-ink-2">
                      자동 {man(a.latestSummary.total)}
                      {a.review?.summary && a.review.status === "corrected"
                        ? ` → 보정 ${man(a.review.summary.total)}`
                        : ""}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
