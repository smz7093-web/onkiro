"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  canTransition,
  CONSULT_STAGE_LABELS,
  CONSULT_STAGES,
  CONSULT_TYPE_LABELS,
  CONSULT_TYPES,
  type ConsultStage,
  type ConsultType,
} from "@/lib/consult/status";
import {
  createProxyConsultation,
  listConsultationsFor,
  listEvents,
  listStaff,
  OWNERSHIP_LABELS,
  OWNERSHIPS,
  updateConsultation,
  type Consultation,
  type ConsultEvent,
  type Ownership,
  type StaffMember,
} from "@/lib/consult/store";
import { diagnosisCode } from "@/lib/diagnosis/store";
import { dateTime } from "./format";
import { useStaff } from "./staff-context";

const btn =
  "h-11 rounded-lg border border-zinc-300 px-4 text-base disabled:opacity-40";
const btnDark =
  "h-11 rounded-lg bg-zinc-900 px-4 text-base font-semibold text-white disabled:opacity-40";
const field =
  "h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-base";

const EVENT_LABEL = {
  status: "단계",
  assignee: "담당자",
  memo: "메모",
} as const;

// 상담 관리 칸반 (CON-02, task.md 9.2). 변경은 서버 함수 updateConsultation이 하고 이력을 남긴다.
export function ConsultBoard() {
  const { user, permissions } = useStaff();
  const canSee =
    permissions.role === "admin" || permissions.consultAccess !== "none";
  const manageAll =
    permissions.role === "admin" || permissions.consultAccess === "all";
  const [list, setList] = useState<Consultation[] | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [typeFilter, setTypeFilter] = useState<ConsultType | "all">("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [showProxy, setShowProxy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    () =>
      listConsultationsFor(user.uid, permissions).then(setList, () =>
        setError("상담 목록을 불러오지 못했습니다."),
      ),
    [user.uid, permissions],
  );

  useEffect(() => {
    if (!canSee) return;
    let cancelled = false;
    listConsultationsFor(user.uid, permissions).then(
      (l) => !cancelled && setList(l),
      () => !cancelled && setError("상담 목록을 불러오지 못했습니다."),
    );
    if (manageAll)
      listStaff().then(
        (s) => !cancelled && setStaff(s),
        () => {},
      );
    return () => {
      cancelled = true;
    };
  }, [canSee, manageAll, user.uid, permissions]);

  if (!canSee) {
    return (
      <p role="alert" className="text-base">
        상담 관리 권한이 없습니다.
      </p>
    );
  }

  const shown = (list ?? []).filter(
    (c) => typeFilter === "all" || c.type === typeFilter,
  );
  const current = list?.find((c) => c.id === selected) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">상담 관리</h1>
        <div className="flex flex-wrap gap-2">
          {(["all", ...CONSULT_TYPES] as const).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={typeFilter === t}
              onClick={() => setTypeFilter(t)}
              className={`h-11 rounded-full border px-4 text-base ${
                typeFilter === t
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-300"
              }`}
            >
              {t === "all" ? "전체" : CONSULT_TYPE_LABELS[t]}
            </button>
          ))}
          {manageAll && (
            <button
              type="button"
              className={btn}
              onClick={() => setShowProxy((v) => !v)}
            >
              {showProxy ? "닫기" : "+ 전화 접수"}
            </button>
          )}
        </div>
      </div>
      <p className="text-sm text-zinc-600">
        접수 후 영업일 1일 안에 첫 연락합니다.{" "}
        {permissions.consultAccess === "assigned" &&
          "내게 배정된 상담만 보입니다."}
      </p>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      {showProxy && (
        <ProxyForm
          onDone={() => {
            setShowProxy(false);
            void load();
          }}
        />
      )}

      {!list ? (
        <p className="text-base">불러오는 중…</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {CONSULT_STAGES.map((stage) => {
            const cards = shown.filter((c) => c.status === stage);
            return (
              <section
                key={stage}
                className="flex flex-col gap-2 rounded-lg bg-zinc-100 p-2"
              >
                <h2 className="flex justify-between px-1 text-sm font-semibold">
                  {CONSULT_STAGE_LABELS[stage]}
                  <span className="text-zinc-500">{cards.length}</span>
                </h2>
                {cards.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelected(c.id === selected ? null : c.id)}
                    className={`flex flex-col gap-1 rounded-md border bg-white p-2 text-left text-sm ${
                      c.id === selected ? "border-zinc-900" : "border-zinc-200"
                    }`}
                  >
                    <span className="font-semibold">
                      {CONSULT_TYPE_LABELS[c.type]}
                    </span>
                    <span>{c.applicantName}</span>
                    <span className="text-zinc-500">
                      {c.createdAt?.toLocaleDateString("ko-KR")}
                      {c.assigneeName ? ` · ${c.assigneeName}` : " · 미배정"}
                    </span>
                    {c.proxyEnteredBy && (
                      <span className="text-zinc-500">전화 접수</span>
                    )}
                  </button>
                ))}
              </section>
            );
          })}
        </div>
      )}

      {current && (
        <ConsultDetail
          key={current.id}
          c={current}
          staff={staff}
          manageAll={manageAll}
          onChanged={() => void load()}
        />
      )}
    </div>
  );
}

function ConsultDetail({
  c,
  staff,
  manageAll,
  onChanged,
}: {
  c: Consultation;
  staff: StaffMember[];
  manageAll: boolean;
  onChanged: () => void;
}) {
  const [memo, setMemo] = useState(c.staffMemo);
  const [events, setEvents] = useState<ConsultEvent[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventsVersion, setEventsVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listEvents(c.id).then(
      (e) => !cancelled && setEvents(e),
      () => !cancelled && setEvents([]),
    );
    return () => {
      cancelled = true;
    };
  }, [c.id, eventsVersion]);

  const nameOf = (uid: string | null) =>
    uid ? (staff.find((s) => s.uid === uid)?.name ?? uid.slice(0, 6)) : "없음";

  async function change(update: Parameters<typeof updateConsultation>[1]) {
    setBusy(true);
    setError(null);
    try {
      await updateConsultation(c.id, update);
      onChanged();
      setEventsVersion((v) => v + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "변경하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  const nextStages = CONSULT_STAGES.filter((s) => canTransition(c.status, s));

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-zinc-300 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">
          {CONSULT_TYPE_LABELS[c.type]} · {c.applicantName}
        </h2>
        <span className="text-sm text-zinc-600">
          접수 {dateTime(c.createdAt)}
        </span>
      </div>
      <dl className="grid grid-cols-[7rem_1fr] gap-y-1 text-base">
        <dt className="text-zinc-600">연락처</dt>
        <dd>
          <a href={`tel:${c.phone}`} className="underline">
            {c.phone}
          </a>
          {c.phoneRequested && " · 전화 상담 요청"}
        </dd>
        <dt className="text-zinc-600">소유 관계</dt>
        <dd>
          {OWNERSHIP_LABELS[c.ownership]}
          {c.ownership === "coHeir" && " (계약 단계에서 동의서 필요)"}
        </dd>
        <dt className="text-zinc-600">희망 연락일</dt>
        <dd>{c.preferredDate ?? "–"}</dd>
        <dt className="text-zinc-600">연결 진단</dt>
        <dd>
          {c.assessmentId ? (
            c.snapshotId ? (
              <Link
                href={`/report/${c.assessmentId}/${c.snapshotId}`}
                className="underline"
              >
                {diagnosisCode(c.assessmentId)} 신청 당시 리포트
              </Link>
            ) : (
              diagnosisCode(c.assessmentId)
            )
          ) : (
            "없음"
          )}
        </dd>
        <dt className="text-zinc-600">신청 메모</dt>
        <dd className="whitespace-pre-wrap">
          {c.memo || "–"}
          {c.proxyEnteredBy && " (전화 접수)"}
        </dd>
      </dl>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm text-zinc-700">
          단계 옮기기
          <select
            className={field}
            value=""
            disabled={busy}
            onChange={(e) =>
              e.target.value &&
              change({ status: e.target.value as ConsultStage })
            }
          >
            <option value="">{CONSULT_STAGE_LABELS[c.status]} → …</option>
            {nextStages.map((s) => (
              <option key={s} value={s}>
                {CONSULT_STAGE_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        {manageAll && (
          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            담당자
            <select
              className={field}
              value={c.assigneeUid ?? ""}
              disabled={busy}
              onChange={(e) => change({ assigneeUid: e.target.value || null })}
            >
              <option value="">미배정</option>
              {staff.map((s) => (
                <option key={s.uid} value={s.uid}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <label className="flex flex-col gap-1 text-sm text-zinc-700">
        상담 메모 (운영팀만 봄)
        <textarea
          className="min-h-24 w-full rounded-md border border-zinc-300 px-3 py-2 text-base"
          maxLength={2000}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
      </label>
      <div>
        <button
          type="button"
          className={btnDark}
          disabled={busy || memo === c.staffMemo}
          onClick={() => change({ memo })}
        >
          메모 저장
        </button>
      </div>
      {error && (
        <p role="alert" className="break-all text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold">변경 이력</h3>
        {!events ? (
          <p className="text-sm">불러오는 중…</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-zinc-500">아직 변경이 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {events.map((e) => (
              <li key={e.id}>
                {dateTime(e.at)} · {nameOf(e.actorUid)} · {EVENT_LABEL[e.kind]}{" "}
                {e.kind === "status"
                  ? `${CONSULT_STAGE_LABELS[e.before as ConsultStage] ?? e.before} → ${CONSULT_STAGE_LABELS[e.after as ConsultStage] ?? e.after}`
                  : e.kind === "assignee"
                    ? `${nameOf(e.before)} → ${nameOf(e.after)}`
                    : "수정"}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

// 전화 접수 대리 입력 (CON-02). 회원 계정이 없는 신청인을 운영팀이 대신 넣는다.
function ProxyForm({ onDone }: { onDone: () => void }) {
  const [type, setType] = useState<ConsultType>("inspection");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [ownership, setOwnership] = useState<Ownership>("self");
  const [preferredDate, setPreferredDate] = useState("");
  const [memo, setMemo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await createProxyConsultation({
        type,
        applicantName: name,
        phone,
        ownership,
        preferredDate: preferredDate || null,
        memo,
      });
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "등록하지 못했습니다.");
      setBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-zinc-300 p-4">
      <h2 className="text-lg font-semibold">전화 접수 대리 입력</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-zinc-700">
          유형
          <select
            className={field}
            value={type}
            onChange={(e) => setType(e.target.value as ConsultType)}
          >
            {CONSULT_TYPES.map((t) => (
              <option key={t} value={t}>
                {CONSULT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-700">
          신청인
          <input
            className={field}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-700">
          연락처
          <input
            className={field}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-700">
          소유 관계
          <select
            className={field}
            value={ownership}
            onChange={(e) => setOwnership(e.target.value as Ownership)}
          >
            {OWNERSHIPS.map((o) => (
              <option key={o} value={o}>
                {OWNERSHIP_LABELS[o]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-700">
          희망 연락일
          <input
            className={field}
            type="date"
            value={preferredDate}
            onChange={(e) => setPreferredDate(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-700">
          메모
          <input
            className={field}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </label>
      </div>
      {error && <p className="break-all text-sm text-red-700">{error}</p>}
      <div>
        <button
          type="button"
          className={btnDark}
          disabled={busy || !name || !phone}
          onClick={submit}
        >
          {busy ? "등록 중…" : "접수 등록"}
        </button>
      </div>
    </section>
  );
}
