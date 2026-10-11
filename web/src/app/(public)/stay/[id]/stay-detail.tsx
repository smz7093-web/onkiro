"use client";

import { useEffect, useState } from "react";
import { getBranch } from "@/lib/branches/store";
import type { Branch } from "@/lib/branches/types";

// TODO(해순, task.md 9.3): 목업 stay-detail처럼 사진, 청결 관리, 편의시설, 체험, 위치,
// 요금과 외부 예약 버튼(에어비앤비·네이버)을 그린다. 공통 UI 컴포넌트(components/ui)가 생기면 그것을 쓴다.
// 데이터는 아래 branch 하나에 모두 들어 있다 (lib/branches/types.ts 참고).
// 예약 버튼을 누를 때 trackReserveClick(branch.id, "airbnb" | "naver")를 부른다 (@/lib/analytics, 클릭 수 기록).
// 예약 링크(branch.airbnbUrl, naverUrl)가 null이면 그 버튼은 숨긴다. 내용은 관리자 화면 /admin/branches에서 고친다.
export function StayDetail({ id }: { id: string }) {
  const [branch, setBranch] = useState<Branch | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    getBranch(id)
      .then((b) => !cancelled && setBranch(b))
      .catch(() => !cancelled && setBranch(null));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (branch === undefined)
    return <p className="p-4 text-base">불러오는 중…</p>;
  if (branch === null)
    return <p className="p-4 text-base">숙소를 찾을 수 없습니다.</p>;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8">
      {branch.sample && (
        <p className="w-fit rounded bg-amber-100 px-2 py-0.5 text-sm text-amber-900">
          샘플 데이터
        </p>
      )}
      <p className="text-sm text-zinc-600">{branch.content.label}</p>
      <h1 className="text-2xl font-semibold">{branch.content.headline}</h1>
      <p className="text-base">{branch.content.summary}</p>
    </main>
  );
}
