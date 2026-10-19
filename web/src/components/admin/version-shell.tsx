"use client";

import { FirebaseError } from "firebase/app";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { can } from "@/lib/permissions";
import {
  activateVersion,
  deleteDraft,
  getVersion,
  saveDraft,
  type VersionData,
  type VersionDoc,
  type VersionKind,
} from "@/lib/versions/store";
import { dateTime, STATUS_LABEL, STATUS_STYLE } from "./format";
import { useStaff } from "./staff-context";
import { buttonClass } from "../ui";

const BASE_PATH: Record<VersionKind, string> = {
  price: "/admin/prices",
  assumption: "/admin/assumptions",
};
const TITLE: Record<VersionKind, string> = {
  price: "단가 DB",
  assumption: "가정값",
};
const EDIT_PERM = {
  price: "canEditPrices",
  assumption: "canEditAssumptions",
} as const;

const message = (e: unknown) =>
  e instanceof FirebaseError
    ? e.message
    : e instanceof Error
      ? e.message
      : String(e);

// 버전 상세: 불러오기·저장·삭제·적용을 맡고, 값 편집은 children(render prop)이 맡는다.
export function VersionShell<K extends VersionKind>({
  kind,
  version,
  children,
}: {
  kind: K;
  version: string;
  children: (args: {
    data: VersionData<K>;
    setData: (next: VersionData<K>) => void;
    readOnly: boolean;
  }) => ReactNode;
}) {
  const { user, name, permissions } = useStaff();
  const router = useRouter();
  const [doc, setDoc] = useState<VersionDoc<K> | null | undefined>(undefined);
  const [data, setDataState] = useState<VersionData<K> | null>(null);
  const [note, setNote] = useState("");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getVersion(kind, version)
      .then((d) => {
        if (cancelled) return;
        setDoc(d);
        setDataState(d?.data ?? null);
        setNote(d?.note ?? "");
      })
      .catch((e) => !cancelled && setError(message(e)));
    return () => {
      cancelled = true;
    };
  }, [kind, version]);

  // 저장하지 않은 변경이 있으면 창을 닫기 전에 묻는다
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  if (error && doc === undefined)
    return (
      <p role="alert" className="text-crit">
        {error}
      </p>
    );
  if (doc === undefined || (doc && !data))
    return <p className="text-base">불러오는 중…</p>;
  if (doc === null)
    return <p className="text-base">버전이 없습니다: {version}</p>;

  const isDraft = doc.status === "draft";
  const canEdit = isDraft && can(permissions, EDIT_PERM[kind]);
  const canActivate = isDraft && can(permissions, "canApproveVersions");

  function setData(next: VersionData<K>) {
    setDataState(next);
    setDirty(true);
    setInfo(null);
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await action();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }

  const save = () =>
    run(async () => {
      await saveDraft(kind, version, data!, note, user, name);
      setDirty(false);
      setInfo("저장했습니다.");
    });

  const remove = () =>
    run(async () => {
      if (!window.confirm(`초안 ${version}을 삭제할까요? 되돌릴 수 없습니다.`))
        return;
      await deleteDraft(kind, version);
      router.push(BASE_PATH[kind]);
    });

  const activate = () =>
    run(async () => {
      if (dirty)
        throw new Error("저장하지 않은 변경이 있습니다. 먼저 저장하세요.");
      if (
        !window.confirm(
          `${version}을 적용할까요? 지금 적용 중인 버전은 '이전 버전'이 되고, 이후 계산에 이 값이 쓰입니다. 적용한 버전은 고칠 수 없습니다.`,
        )
      )
        return;
      const result = await activateVersion(kind, version);
      const fresh = await getVersion(kind, version);
      setDoc(fresh);
      setInfo(
        `적용했습니다.${result.retired.length ? ` 이전 버전: ${result.retired.join(", ")}` : ""}`,
      );
    });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href={BASE_PATH[kind]} className="text-sm text-ink-2 underline">
          ← {TITLE[kind]} 목록
        </Link>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-2xl font-semibold">{version}</h1>
        <span
          className={`rounded px-2 py-0.5 text-sm ${STATUS_STYLE[doc.status]}`}
        >
          {STATUS_LABEL[doc.status]}
        </span>
      </div>
      <dl className="grid grid-cols-[7rem_1fr] gap-x-4 gap-y-1 text-sm text-ink-2 sm:grid-cols-[7rem_1fr_7rem_1fr]">
        <dt>복사한 버전</dt>
        <dd className="font-mono">{doc.basedOn ?? "임시 기준값"}</dd>
        <dt>작성</dt>
        <dd>
          {doc.createdByName ?? "–"} · {dateTime(doc.createdAt)}
        </dd>
        <dt>마지막 수정</dt>
        <dd>
          {doc.updatedByName ?? "–"} · {dateTime(doc.updatedAt)}
        </dd>
        <dt>적용</dt>
        <dd>
          {doc.approvedByName ?? "–"} · {dateTime(doc.effectiveFrom)}
        </dd>
      </dl>

      {!isDraft && (
        <p className="rounded-lg bg-surface-2 p-3 text-sm text-ink-2">
          {STATUS_LABEL[doc.status]} 버전은 고칠 수 없습니다. 바꾸려면 목록에서
          이 버전을 복사해 새 초안을 만드세요.
        </p>
      )}

      {children({ data: data!, setData, readOnly: !canEdit })}

      <label className="flex flex-col gap-1 text-sm text-ink-2">
        변경 메모 (무엇을 왜 바꿨는지)
        <textarea
          className="min-h-20 rounded-md border border-line-2 p-3 text-base read-only:bg-surface-2"
          value={note}
          readOnly={!canEdit}
          onChange={(e) => {
            setNote(e.target.value);
            setDirty(true);
          }}
        />
      </label>

      {/* 저장 바: 상태 문구는 버튼 위 고정 줄에(버튼이 밀리지 않게, UX기준 0번), 저장=주요 버튼 하나, 삭제는 오른쪽 끝에 떨어뜨린다(피츠) */}
      <div className="sticky bottom-0 flex flex-col gap-2 border-t border-line bg-surface py-3">
        <p className="min-h-6 text-sm" role={error ? "alert" : "status"}>
          {error ? (
            <span className="break-all text-crit">{error}</span>
          ) : info ? (
            <span className="text-good">{info}</span>
          ) : dirty ? (
            <span className="text-warn">저장하지 않은 변경이 있습니다</span>
          ) : null}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {canEdit && (
            <button
              type="button"
              onClick={save}
              disabled={busy || !dirty}
              className={buttonClass({ variant: "primary" })}
            >
              {busy ? "처리 중…" : "저장"}
            </button>
          )}
          {canActivate && (
            <button
              type="button"
              onClick={activate}
              disabled={busy}
              className={buttonClass()}
            >
              적용 (운영 견적에 반영)
            </button>
          )}
          {canEdit && (
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className={`${buttonClass({ variant: "danger" })} ml-auto`}
            >
              초안 삭제
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
