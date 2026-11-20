"use client";

import { useEffect, useState } from "react";
import { countPhotos } from "@/lib/diagnosis/photo-store";
import { photoRetention } from "@/lib/diagnosis/retention";
import type { Assessment } from "@/lib/diagnosis/store";

// 마이페이지 진단 카드의 사진 보관 기한 한 줄 (task.md 11.2, 처리방침 진단 사진 항목).
// 사진이 없는 진단에는 아무것도 보이지 않는다.
export function PhotoRetentionLine({
  assessment: a,
  hasConsult,
}: {
  assessment: Assessment;
  hasConsult: boolean;
}) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    countPhotos(a.id)
      .then((n) => !cancelled && setCount(n))
      .catch(() => !cancelled && setCount(null));
    return () => {
      cancelled = true;
    };
  }, [a.id]);

  if (count === null) return null;
  if (count === 0) {
    if (!a.photosPurgedAt) return null;
    return (
      <span className="text-sm text-ink-2">
        사진 {a.photosPurgedAt.toLocaleDateString("ko-KR")} 삭제됨 (보관 기간
        만료 또는 삭제 요청)
      </span>
    );
  }
  const r = photoRetention({
    lastUsedAt: a.lastUsedAt,
    updatedAt: a.updatedAt,
    createdAt: a.createdAt,
    hasConsult: hasConsult || a.lastConsultId !== null,
  });
  if (!r) return null;
  return (
    <span className="text-sm text-ink-2">
      사진 {count}장 ·{" "}
      {r.kind === "consult"
        ? "상담 중인 진단이라 보관합니다"
        : `${r.at.toLocaleDateString("ko-KR")}까지 보관 (진단을 열면 1년 연장)`}
    </span>
  );
}
