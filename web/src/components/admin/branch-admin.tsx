"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { can } from "@/lib/permissions";
import { listBranches, type BranchSummary } from "@/lib/branches/store";
import { SAMPLE_BRANCHES } from "@/lib/branches/sample";
import { isBranchId } from "@/lib/branches/validate";
import { dateTime } from "./format";
import { useStaff } from "./staff-context";

// 숙소 콘텐츠 목록 (STY-01, task.md 9.3). 콘텐츠 편집 권한자(canEditContent)만 쓴다.
export function BranchList() {
  const { permissions } = useStaff();
  const router = useRouter();
  const [list, setList] = useState<BranchSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newId, setNewId] = useState("");
  const allowed = can(permissions, "canEditContent");

  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    listBranches().then(
      (l) => !cancelled && setList(l),
      () => !cancelled && setError("숙소 목록을 불러오지 못했습니다."),
    );
    return () => {
      cancelled = true;
    };
  }, [allowed]);

  if (!allowed)
    return (
      <p role="alert" className="text-base">
        숙소 콘텐츠 편집 권한이 없습니다.
      </p>
    );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">숙소 콘텐츠</h1>
      <p className="text-sm text-zinc-600">
        숙소 상세 화면(/stay/주소)에 보이는 내용입니다. 저장하면 바로 공개
        화면에 반영됩니다.
      </p>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {!list ? (
        <p className="text-base">불러오는 중…</p>
      ) : list.length === 0 ? (
        <p className="text-base text-zinc-600">
          아직 등록한 숙소가 없습니다. 아래에서 새 숙소를 만드세요.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map((b) => (
            <li
              key={b.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 p-3"
            >
              <div className="flex flex-col">
                <span className="text-base font-semibold">
                  {b.name} · {b.content.headline}
                </span>
                <span className="text-sm text-zinc-600">
                  /stay/{b.id} · {b.updatedByName ?? "–"} ·{" "}
                  {dateTime(b.updatedAt)}
                </span>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/stay/${b.id}`}
                  target="_blank"
                  className="inline-flex h-11 items-center rounded-lg border border-zinc-300 px-4 text-base"
                >
                  보기
                </Link>
                <Link
                  href={`/admin/branches/${b.id}`}
                  className="inline-flex h-11 items-center rounded-lg bg-zinc-900 px-4 text-base font-semibold text-white"
                >
                  편집
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4">
        <h2 className="text-lg font-semibold">새 숙소</h2>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (isBranchId(newId)) router.push(`/admin/branches/${newId}`);
          }}
        >
          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            주소에 쓸 이름 (영문 소문자·숫자·하이픈)
            <input
              className="h-11 rounded-md border border-zinc-300 px-3 font-mono text-base"
              placeholder="hongseong-1"
              value={newId}
              onChange={(e) => setNewId(e.target.value.trim())}
            />
          </label>
          <button
            type="submit"
            disabled={
              !isBranchId(newId) || (list ?? []).some((b) => b.id === newId)
            }
            className="h-11 rounded-lg bg-zinc-900 px-4 text-base font-semibold text-white disabled:opacity-40"
          >
            만들기
          </button>
        </form>
        <p className="text-xs text-zinc-500">
          만든 뒤 숙소 주소는 /stay/{newId || "이름"}이 됩니다. 나중에 바꿀 수
          없으니 신중히 정하세요. 샘플(
          {SAMPLE_BRANCHES.map((s) => s.id).join(", ")}) 이름으로 만들면 샘플
          내용에서 시작합니다.
        </p>
      </section>
    </div>
  );
}
