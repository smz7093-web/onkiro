"use client";

import { Fragment, useEffect, useState } from "react";
import { FLAG_KEYS, type AccessLevel, type Role } from "@/lib/permissions";
import {
  ACCESS_LABEL,
  effectiveForm,
  FLAG_LABEL,
  PRESETS,
  ROLE_LABEL,
  sameForm,
  type PermissionForm,
} from "@/lib/members/form";
import { listMembers, savePermissions, type Member } from "@/lib/members/store";
import { dateTime } from "./format";
import { useStaff } from "./staff-context";
import { buttonClass } from "../ui";

type Filter = "staff" | "member" | "all";

const ROLE_STYLE: Record<Role, string> = {
  admin: "bg-good-soft text-good",
  staff: "bg-sky-100 text-sky-900",
  member: "bg-surface-2 text-ink-2",
};

// 회원·권한 관리 (ADM-05, task.md 2.5). 관리자만 쓴다.
export function MemberAdmin() {
  const { user, permissions } = useStaff();
  const [members, setMembers] = useState<Member[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("staff");
  const [editing, setEditing] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const isAdmin = permissions.role === "admin";

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    listMembers()
      .then((list) => !cancelled && setMembers(list))
      .catch((e) => !cancelled && setError(String(e)));
    return () => {
      cancelled = true;
    };
  }, [isAdmin, reload]);

  if (!isAdmin) {
    return (
      <p role="alert" className="text-base">
        회원·권한 관리는 관리자만 볼 수 있습니다.
      </p>
    );
  }

  const staffCount =
    members?.filter((m) => m.form.role !== "member").length ?? 0;
  const shown =
    members?.filter((m) =>
      filter === "all"
        ? true
        : filter === "staff"
          ? m.form.role !== "member"
          : m.form.role === "member",
    ) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">회원·권한</h1>
        {members && (
          <div className="flex gap-2" role="group" aria-label="목록 필터">
            {(
              [
                ["staff", `운영팀 ${staffCount}`],
                ["member", `일반 회원 ${members.length - staffCount}`],
                ["all", `전체 ${members.length}`],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                aria-pressed={filter === id}
                className={`h-11 rounded-full border px-4 text-base ${
                  filter === id
                    ? "border-accent bg-accent text-accent-ink"
                    : "border-line-2"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-sm text-ink-2">
        팀원은 먼저 카카오로 한 번 로그인해야 목록에 나타납니다. 일반 회원
        목록에서 찾아 권한을 바꾸세요. 바뀐 권한은 그 사람이 로그인 화면의
        &lsquo;권한 새로고침&rsquo;을 누르거나 다시 로그인하면 반영됩니다.
      </p>

      {error && (
        <p role="alert" className="break-all text-sm text-crit">
          {error}
        </p>
      )}

      {!members ? (
        <p className="text-base">불러오는 중…</p>
      ) : shown.length === 0 ? (
        <p className="text-base text-ink-2">해당하는 회원이 없습니다.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-base">
            <thead>
              <tr className="border-b border-line-2 text-sm text-ink-2">
                <th className="py-2 pr-4">이름</th>
                <th className="py-2 pr-4">역할</th>
                <th className="py-2 pr-4">진단 사진</th>
                <th className="py-2 pr-4">상담</th>
                <th className="py-2 pr-4">권한</th>
                <th className="py-2 pr-4">가입</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {shown.map((m) => {
                const eff = effectiveForm(m.form);
                const flags = FLAG_KEYS.filter((k) => eff.flags[k]);
                return (
                  <Fragment key={m.uid}>
                    <tr className="border-b border-line align-top">
                      <td className="py-2 pr-4">
                        {m.name ?? "(이름 없음)"}
                        {m.uid === user.uid && (
                          <span className="ml-1 text-sm text-muted">(나)</span>
                        )}
                        <div className="font-mono text-xs text-muted">
                          {m.uid.slice(0, 8)}
                        </div>
                      </td>
                      <td className="py-2 pr-4">
                        <span
                          className={`rounded px-2 py-0.5 text-sm ${ROLE_STYLE[eff.role]}`}
                        >
                          {ROLE_LABEL[eff.role]}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-sm">
                        {ACCESS_LABEL[eff.photoAccess]}
                      </td>
                      <td className="py-2 pr-4 text-sm">
                        {ACCESS_LABEL[eff.consultAccess]}
                      </td>
                      <td className="py-2 pr-4 text-sm">
                        {eff.role === "admin"
                          ? "전체"
                          : flags.map((k) => FLAG_LABEL[k]).join(", ") || "–"}
                      </td>
                      <td className="py-2 pr-4 text-sm">
                        {dateTime(m.createdAt)}
                      </td>
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setEditing(editing === m.uid ? null : m.uid)
                          }
                          className={buttonClass()}
                        >
                          {editing === m.uid ? "닫기" : "변경"}
                        </button>
                      </td>
                    </tr>
                    {editing === m.uid && (
                      <tr className="border-b border-line">
                        <td colSpan={7} className="bg-surface-2 p-4">
                          <PermissionEditor
                            member={m}
                            isSelf={m.uid === user.uid}
                            onSaved={() => {
                              setEditing(null);
                              setReload((n) => n + 1);
                            }}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PermissionEditor({
  member,
  isSelf,
  onSaved,
}: {
  member: Member;
  isSelf: boolean;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<PermissionForm>(member.form);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const changed = !sameForm(form, member.form);
  const isStaffForm = form.role === "staff";

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await savePermissions(member.uid, form);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  const levelSelect = (
    label: string,
    value: AccessLevel,
    onChange: (v: AccessLevel) => void,
  ) => (
    <label className="flex flex-col gap-1 text-sm text-ink-2">
      {label}
      <select
        className="h-11 rounded-md border border-line-2 bg-surface px-3 text-base disabled:opacity-50"
        value={value}
        disabled={!isStaffForm}
        onChange={(e) => onChange(e.target.value as AccessLevel)}
      >
        {(["none", "assigned", "all"] as const).map((v) => (
          <option key={v} value={v}>
            {ACCESS_LABEL[v]}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm text-ink-2">
          역할
          <select
            className="h-11 rounded-md border border-line-2 bg-surface px-3 text-base disabled:opacity-50"
            value={form.role}
            disabled={isSelf}
            onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
          >
            {(["member", "staff", "admin"] as const).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
        </label>
        {levelSelect("진단 사진", form.photoAccess, (v) =>
          setForm({ ...form, photoAccess: v }),
        )}
        {levelSelect("상담", form.consultAccess, (v) =>
          setForm({ ...form, consultAccess: v }),
        )}
        {!isSelf && (
          <label className="flex flex-col gap-1 text-sm text-ink-2">
            팀원 권장 설정 불러오기
            <select
              className="h-11 rounded-md border border-line-2 bg-surface px-3 text-base"
              value=""
              onChange={(e) => {
                const p = PRESETS.find((x) => x.id === e.target.value);
                if (p) setForm({ ...p.form, flags: { ...p.form.flags } });
              }}
            >
              <option value="">선택…</option>
              {PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <fieldset
        disabled={!isStaffForm}
        className="flex flex-wrap gap-x-6 gap-y-2 disabled:opacity-50"
      >
        <legend className="mb-2 text-sm text-ink-2">
          세부 권한 {form.role === "admin" && "(관리자는 모두 허용)"}
          {form.role === "member" && "(일반 회원은 권한 없음)"}
        </legend>
        {FLAG_KEYS.map((k) => (
          <label key={k} className="flex min-h-11 items-center gap-2 text-base">
            <input
              type="checkbox"
              className="size-5"
              checked={effectiveForm(form).flags[k]}
              onChange={(e) =>
                setForm({
                  ...form,
                  flags: { ...form.flags, [k]: e.target.checked },
                })
              }
            />
            {FLAG_LABEL[k]}
          </label>
        ))}
      </fieldset>

      {isStaffForm && form.flags.canApproveVersions && (
        <p className="text-sm text-warn">
          단가·가정값 적용은 두 사람 확인 원칙에 따라 PM만 하기로
          했습니다(prd.md 2절). 꼭 필요한 경우에만 켜세요.
        </p>
      )}
      {isSelf && (
        <p className="text-sm text-ink-2">
          본인의 관리자 권한은 내릴 수 없습니다.
        </p>
      )}
      {error && (
        <p role="alert" className="break-all text-sm text-crit">
          {error}
        </p>
      )}

      <div>
        <button
          type="button"
          onClick={save}
          disabled={busy || !changed}
          className={buttonClass({ variant: "primary" })}
        >
          {busy ? "저장 중…" : "저장"}
        </button>
      </div>
    </div>
  );
}
