"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ASSUMPTION_V0_3, PRICE_V2026_10_1 } from "@/lib/engine/defaults";
import { can } from "@/lib/permissions";
import {
  createDraft,
  listVersions,
  suggestNextVersion,
  type VersionData,
  type VersionDoc,
  type VersionKind,
} from "@/lib/versions/store";
import { dateTime, STATUS_LABEL, STATUS_STYLE } from "./format";
import { useStaff } from "./staff-context";
import { DTag } from "./d-tag";
import { buttonClass } from "../ui";

const TITLE: Record<VersionKind, string> = {
  price: "단가 DB",
  assumption: "가정값",
};
const BASE_PATH: Record<VersionKind, string> = {
  price: "/admin/prices",
  assumption: "/admin/assumptions",
};
const EDIT_PERM = {
  price: "canEditPrices",
  assumption: "canEditAssumptions",
} as const;
// 버전이 하나도 없을 때 쓰는 임시 기준값 (task.md 5.4)
const DEFAULTS = { price: PRICE_V2026_10_1, assumption: ASSUMPTION_V0_3 };

// 버전 목록과 새 초안 만들기 (ADM-01·02)
export function VersionList({ kind }: { kind: VersionKind }) {
  const { user, name, permissions } = useStaff();
  const router = useRouter();
  const [versions, setVersions] = useState<VersionDoc[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [base, setBase] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const canEdit = can(permissions, EDIT_PERM[kind]);

  useEffect(() => {
    let cancelled = false;
    listVersions(kind)
      .then((list) => {
        if (cancelled) return;
        setVersions(list);
        setNewName(
          suggestNextVersion(
            kind,
            list.map((v) => v.id),
          ),
        );
        setBase(
          list.find((v) => v.status === "active")?.id ??
            list[0]?.id ??
            "defaults",
        );
      })
      .catch((e) => !cancelled && setError(String(e)));
    return () => {
      cancelled = true;
    };
  }, [kind]);

  async function create() {
    setBusy(true);
    setError(null);
    try {
      const source = versions?.find((v) => v.id === base);
      const data = (source ? source.data : DEFAULTS[kind]) as VersionData<
        typeof kind
      >;
      await createDraft(
        kind,
        newName.trim(),
        data,
        source?.id ?? null,
        user,
        name,
      );
      router.push(`${BASE_PATH[kind]}/${encodeURIComponent(newName.trim())}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">
        {TITLE[kind]} 버전{" "}
        <DTag ids={kind === "price" ? ["D2", "D3", "D4", "D5"] : ["D6"]} />
      </h1>
      {error && (
        <p role="alert" className="break-all text-sm text-crit">
          {error}
        </p>
      )}
      {!versions ? (
        <p className="text-base">불러오는 중…</p>
      ) : versions.length === 0 ? (
        <p className="text-base text-ink-2">
          아직 버전이 없습니다. 아래에서 임시 기준값으로 첫 초안을 만들고
          적용하세요.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-base">
            <thead>
              <tr className="border-b border-line-2 text-sm text-ink-2">
                <th className="py-2 pr-4">버전</th>
                <th className="py-2 pr-4">상태</th>
                <th className="py-2 pr-4">적용 시작</th>
                <th className="py-2 pr-4">작성</th>
                <th className="py-2 pr-4">적용</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((v) => (
                <tr key={v.id} className="border-b border-line">
                  <td className="py-2 pr-4">
                    <Link
                      href={`${BASE_PATH[kind]}/${encodeURIComponent(v.id)}`}
                      className="font-mono underline"
                    >
                      {v.id}
                    </Link>
                  </td>
                  <td className="py-2 pr-4">
                    <span
                      className={`rounded px-2 py-0.5 text-sm ${STATUS_STYLE[v.status]}`}
                    >
                      {STATUS_LABEL[v.status]}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-sm">
                    {dateTime(v.effectiveFrom)}
                  </td>
                  <td className="py-2 pr-4 text-sm">
                    {v.createdByName ?? "–"} · {dateTime(v.createdAt)}
                  </td>
                  <td className="py-2 pr-4 text-sm">
                    {v.approvedByName ?? "–"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canEdit && versions && (
        <section className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4">
          <h2 className="text-lg font-semibold">새 초안 만들기</h2>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm text-ink-2">
              버전 이름
              <input
                className="h-11 rounded-md border border-line-2 px-3 font-mono text-base bg-surface text-ink"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-ink-2">
              복사할 값
              <select
                className="h-11 rounded-md border border-line-2 px-3 text-base bg-surface text-ink"
                value={base}
                onChange={(e) => setBase(e.target.value)}
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.id} ({STATUS_LABEL[v.status]})
                  </option>
                ))}
                <option value="defaults">
                  임시 기준값 ({DEFAULTS[kind].version})
                </option>
              </select>
            </label>
            <button
              type="button"
              onClick={create}
              disabled={busy || !/^v[\w.-]+$/.test(newName.trim())}
              className={buttonClass({ variant: "primary" })}
            >
              초안 만들기
            </button>
          </div>
          <p className="text-xs text-muted">
            버전 이름은 v로 시작하고 영문·숫자·점·하이픈만 씁니다. 초안은
            적용하기 전까지 시뮬레이터에 쓰이지 않습니다.
          </p>
        </section>
      )}
    </div>
  );
}
