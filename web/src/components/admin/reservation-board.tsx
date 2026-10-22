"use client";

import { useEffect, useState } from "react";
import { can } from "@/lib/permissions";
import { listBranches, type BranchSummary } from "@/lib/branches/store";
import {
  addDays,
  nightsOf,
  readBooking,
  RESERVATION_STATUS_LABELS,
  shortDate,
  todayKst,
  type ReservationStatus,
} from "@/lib/reservations/rules";
import {
  getCalendar,
  listReservations,
  saveBlockedDates,
  updateReservation,
  type Reservation,
} from "@/lib/reservations/store";
import { BookingCalendar, type DayState } from "../stay/booking-calendar";
import { Button, Card, Notice, Pill, type PillTone } from "../ui";
import { useStaff } from "./staff-context";

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

const TONE: Record<ReservationStatus, PillTone> = {
  requested: "warn",
  confirmed: "good",
  rejected: "neutral",
  cancelled: "neutral",
};

type Tab = "requested" | "confirmed" | "closed";
const TABS: { id: Tab; label: string }[] = [
  { id: "requested", label: "확인 중" },
  { id: "confirmed", label: "확정" },
  { id: "closed", label: "불가·취소" },
];
const inTab = (r: Reservation, t: Tab) =>
  t === "closed"
    ? r.status === "rejected" || r.status === "cancelled"
    : r.status === t;

// 예약 신청 관리 (STY-06·ADM-09, task.md 9.8). 관리자·콘텐츠 편집 권한(숙소 담당)이 확정·거절하고 막을 날짜를 고친다.
export function ReservationBoard() {
  const { permissions } = useStaff();
  const allowed = can(permissions, "canEditContent");
  const [list, setList] = useState<Reservation[] | null>(null);
  const [tab, setTab] = useState<Tab>("requested");
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    try {
      setList(await listReservations());
    } catch {
      setError("예약 목록을 불러오지 못했습니다.");
    }
  }

  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    listReservations().then(
      (rs) => !cancelled && setList(rs),
      () => !cancelled && setError("예약 목록을 불러오지 못했습니다."),
    );
    return () => {
      cancelled = true;
    };
  }, [allowed]);

  if (!allowed)
    return (
      <Notice tone="warn">
        예약 관리는 관리자 또는 콘텐츠 편집 권한(숙소 담당)이 있어야 합니다.
      </Notice>
    );

  const shown = (list ?? []).filter((r) => inTab(r, tab));
  // 같은 숙소에서 날짜가 겹치는 다른 신청·확정 (확정 전에 확인)
  const overlapsOf = (r: Reservation) => {
    const mine = new Set(nightsOf(r.checkIn, r.checkOut));
    return (list ?? []).filter(
      (o) =>
        o.id !== r.id &&
        o.branchId === r.branchId &&
        (o.status === "requested" || o.status === "confirmed") &&
        nightsOf(o.checkIn, o.checkOut).some((n) => mine.has(n)),
    );
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">예약 신청</h1>
        <p className="text-base text-ink-2">
          확인 중인 신청은 날짜를 확인한 뒤 확정하거나 &lsquo;예약 불가&rsquo;로
          답합니다. 확정하면 그 날짜가 숙소 달력에서 막히고, 게스트 마이페이지에
          입금 안내가 보입니다. 게스트에게는 운영팀이 전화·문자로도 알립니다.
        </p>
      </div>

      <div role="tablist" className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const n = (list ?? []).filter((r) => inTab(r, t.id)).length;
          return (
            <Button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              variant={tab === t.id ? "primary" : "secondary"}
              size="sm"
              onClick={() => setTab(t.id)}
            >
              {t.label} {n}
            </Button>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="text-base text-crit">
          {error}
        </p>
      )}
      {!list ? (
        <p className="text-base">불러오는 중…</p>
      ) : shown.length === 0 ? (
        <p className="text-base text-muted">이 칸에는 예약이 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {shown.map((r) => (
            <ReservationCard
              key={r.id}
              r={r}
              overlaps={overlapsOf(r)}
              onChanged={reload}
            />
          ))}
        </ul>
      )}

      <BlockedDatesEditor />
    </div>
  );
}

function ReservationCard({
  r,
  overlaps,
  onChanged,
}: {
  r: Reservation;
  overlaps: Reservation[];
  onChanged: () => Promise<void>;
}) {
  const [memo, setMemo] = useState(r.staffMemo);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function change(
    next: { status?: ReservationStatus; memo?: string },
    ask?: string,
  ) {
    if (ask && !window.confirm(ask)) return;
    setBusy(true);
    setError(null);
    try {
      await updateReservation(r.id, next);
      await onChanged();
    } catch (e) {
      setError(
        e instanceof Error && e.message ? e.message : "바꾸지 못했습니다.",
      );
    } finally {
      setBusy(false);
    }
  }

  const when = `${shortDate(r.checkIn)} → ${shortDate(r.checkOut)} (${r.nights}박)`;
  return (
    <li>
      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-lg font-semibold">{when}</span>
          <Pill tone={TONE[r.status]}>
            {RESERVATION_STATUS_LABELS[r.status]}
          </Pill>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-base">
          <dt className="text-ink-2">숙소</dt>
          <dd>{r.branchName}</dd>
          <dt className="text-ink-2">예약자</dt>
          <dd>
            {r.guestName} ·{" "}
            <a href={`tel:${r.phone}`} className="underline">
              {r.phone}
            </a>{" "}
            · {r.guests}명
          </dd>
          <dt className="text-ink-2">예상 금액</dt>
          <dd>{r.estimate > 0 ? won(r.estimate) : "—"}</dd>
          <dt className="text-ink-2">신청</dt>
          <dd>{r.createdAt?.toLocaleString("ko-KR") ?? ""}</dd>
          {r.memo && (
            <>
              <dt className="text-ink-2">요청 사항</dt>
              <dd className="whitespace-pre-line">{r.memo}</dd>
            </>
          )}
        </dl>
        {overlaps.length > 0 && (
          <Notice tone="warn">
            같은 날짜에 겹치는 예약이 있습니다:{" "}
            {overlaps
              .map(
                (o) =>
                  `${o.guestName} ${shortDate(o.checkIn)}~ (${RESERVATION_STATUS_LABELS[o.status]})`,
              )
              .join(", ")}
          </Notice>
        )}
        <label className="flex flex-col gap-1 text-sm text-ink-2">
          운영팀 메모 (게스트에게 보이지 않음)
          <textarea
            className="min-h-16 w-full rounded-md border border-line-2 bg-surface px-3 py-2 text-base text-ink"
            maxLength={2000}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-crit">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {r.status === "requested" && (
            <>
              <Button
                variant="primary"
                disabled={busy}
                onClick={() =>
                  change(
                    { status: "confirmed" },
                    `${when} 예약을 확정할까요? 이 날짜는 숙소 달력에서 막힙니다. 에어비앤비·네이버 달력도 직접 막아 주세요.`,
                  )
                }
              >
                확정
              </Button>
              <Button
                disabled={busy}
                onClick={() =>
                  change({ status: "rejected" }, "예약 불가로 답할까요?")
                }
              >
                예약 불가
              </Button>
            </>
          )}
          {memo !== r.staffMemo && (
            <Button disabled={busy} onClick={() => change({ memo })}>
              메모 저장
            </Button>
          )}
          {(r.status === "requested" || r.status === "confirmed") && (
            <Button
              variant="danger"
              className="ml-auto"
              disabled={busy}
              onClick={() =>
                change(
                  { status: "cancelled" },
                  r.status === "confirmed"
                    ? "확정된 예약을 취소할까요? 달력에서 이 날짜가 다시 열립니다."
                    : "이 신청을 취소할까요?",
                )
              }
            >
              취소
            </Button>
          )}
        </div>
      </Card>
    </li>
  );
}

// 막을 날짜 (OTA 예약·휴무). 확정 예약의 날짜는 자동으로 막혀 여기서 풀 수 없다
function BlockedDatesEditor() {
  const { user } = useStaff();
  const [branches, setBranches] = useState<BranchSummary[] | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [booked, setBooked] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listBranches()
      .then((bs) => {
        setBranches(bs);
        const first =
          bs.find((b) => readBooking(b.content.booking).enabled) ?? bs[0];
        if (first) setBranchId(first.id);
      })
      .catch(() => setMessage("숙소 목록을 불러오지 못했습니다."));
  }, []);

  useEffect(() => {
    if (!branchId) return;
    let cancelled = false;
    getCalendar(branchId).then(
      (cal) => {
        if (cancelled) return;
        setBlocked(new Set(cal.blocked));
        setSaved(new Set(cal.blocked));
        setBooked(new Set(cal.booked));
        setMessage(null);
      },
      () => !cancelled && setMessage("달력을 불러오지 못했습니다."),
    );
    return () => {
      cancelled = true;
    };
  }, [branchId]);

  const today = todayKst();
  const dirty =
    blocked.size !== saved.size || [...blocked].some((d) => !saved.has(d));
  const stateOf = (d: string): DayState =>
    d < today
      ? "past"
      : booked.has(d)
        ? "booked"
        : blocked.has(d)
          ? "blocked"
          : "free";

  async function save() {
    if (!branchId || !user) return;
    setBusy(true);
    try {
      // 지난 날짜는 정리해서 저장한다
      const next = [...blocked].filter((d) => d >= today);
      await saveBlockedDates(branchId, next, user);
      setSaved(new Set(next));
      setBlocked(new Set(next));
      setMessage("저장했습니다. 예약 화면에 바로 반영됩니다.");
    } catch {
      setMessage("저장하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">예약 막을 날짜</h2>
      <p className="text-base text-ink-2">
        에어비앤비·네이버로 예약된 날이나 쉬는 날을 눌러 막습니다(다시 누르면
        풀림). 빨간 줄은 온기로에서 확정된 예약이라 여기서 풀 수 없습니다.
        날짜는 그 날 밤 기준입니다.
      </p>
      {branches && branches.length > 1 && (
        <select
          className="h-12 w-full max-w-xs rounded-md border border-line-2 bg-surface px-3 text-base"
          value={branchId ?? ""}
          onChange={(e) => setBranchId(e.target.value)}
        >
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name || b.id}
            </option>
          ))}
        </select>
      )}
      {branchId && (
        <Card>
          <BookingCalendar
            start={today}
            stateOf={stateOf}
            canPick={(d) =>
              d >= today && !booked.has(d) && d <= addDays(today, 400)
            }
            onPick={(d) =>
              setBlocked((s) => {
                const n = new Set(s);
                if (n.has(d)) n.delete(d);
                else n.add(d);
                return n;
              })
            }
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" disabled={busy || !dirty} onClick={save}>
              {busy ? "저장 중…" : "저장"}
            </Button>
            <span role="status" className="text-sm text-ink-2">
              {dirty ? "저장하지 않은 변경이 있습니다" : message}
            </span>
          </div>
        </Card>
      )}
    </section>
  );
}
