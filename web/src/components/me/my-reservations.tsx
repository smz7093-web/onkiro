"use client";

import { useEffect, useState } from "react";
import { getBranch } from "@/lib/branches/store";
import {
  readBooking,
  RESERVATION_STATUS_LABELS,
  shortDate,
  type ReservationStatus,
} from "@/lib/reservations/rules";
import {
  listMyReservations,
  updateReservation,
  type Reservation,
} from "@/lib/reservations/store";
import { card } from "@/components/diagnose/styles";
import { Button, Notice, Pill, type PillTone } from "../ui";

const TONE: Record<ReservationStatus, PillTone> = {
  requested: "warn",
  confirmed: "good",
  rejected: "neutral",
  cancelled: "neutral",
};

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

// 마이페이지 숙소 예약 신청 내역 (STY-06). 확인 중이면 취소할 수 있고, 확정되면 입금 안내가 보인다.
// 신청이 하나도 없으면 칸을 숨긴다(예약을 안 쓰는 회원에게는 보이지 않게).
export function MyReservations({ uid }: { uid: string }) {
  const [list, setList] = useState<Reservation[] | null>(null);
  const [guides, setGuides] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 내 신청 목록과, 확정된 숙소의 입금 안내
  async function fetchAll() {
    const rs = await listMyReservations(uid);
    const ids = [
      ...new Set(
        rs.filter((r) => r.status === "confirmed").map((r) => r.branchId),
      ),
    ];
    const entries = await Promise.all(
      ids.map(async (id) => {
        const b = await getBranch(id).catch(() => null);
        return [id, readBooking(b?.content.booking).paymentGuide] as const;
      }),
    );
    return { rs, guides: Object.fromEntries(entries) };
  }

  async function load() {
    const r = await fetchAll();
    setList(r.rs);
    setGuides(r.guides);
  }

  useEffect(() => {
    let cancelled = false;
    fetchAll().then(
      (r) => {
        if (cancelled) return;
        setList(r.rs);
        setGuides(r.guides);
      },
      () => !cancelled && setError("예약 내역을 불러오지 못했습니다."),
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  async function cancel(r: Reservation) {
    if (!window.confirm("이 예약 신청을 취소할까요?")) return;
    setBusy(r.id);
    setError(null);
    try {
      await updateReservation(r.id, { status: "cancelled" });
      await load();
    } catch {
      setError("취소하지 못했습니다. 운영팀에 연락해 주세요.");
    } finally {
      setBusy(null);
    }
  }

  if (error)
    return (
      <p role="alert" className="text-base text-crit">
        {error}
      </p>
    );
  if (!list || list.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">숙소 예약 신청</h2>
      <ul className="flex flex-col gap-3">
        {list.map((r) => (
          <li key={r.id} className={card}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold">{r.branchName}</span>
              <Pill tone={TONE[r.status]}>
                {RESERVATION_STATUS_LABELS[r.status]}
              </Pill>
            </div>
            <span className="text-base">
              {shortDate(r.checkIn)} → {shortDate(r.checkOut)} ({r.nights}박) ·{" "}
              {r.guests}명{r.estimate > 0 && ` · 예상 ${won(r.estimate)}`}
            </span>
            <span className="text-sm text-ink-2">
              신청 {r.createdAt?.toLocaleDateString("ko-KR") ?? ""}
            </span>
            {r.status === "requested" && (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-ink-2">
                  운영팀이 날짜를 확인하고 있습니다. 아직 확정 전입니다.
                </span>
                <Button
                  size="sm"
                  disabled={busy === r.id}
                  onClick={() => cancel(r)}
                >
                  신청 취소
                </Button>
              </div>
            )}
            {r.status === "confirmed" && (
              <Notice tone="info" title="입금 안내">
                <span className="whitespace-pre-line text-sm">
                  {guides[r.branchId] ||
                    "운영팀이 연락처로 입금 방법을 안내드립니다."}
                </span>
                <span className="text-sm text-ink-2">
                  확정 후 취소는 운영팀에 연락해 주세요.
                </span>
              </Notice>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
