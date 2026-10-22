"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuthUser } from "@/lib/auth/use-auth-user";
import { useMemberName } from "@/lib/auth/use-member-name";
import { trackReserveClick } from "@/lib/analytics";
import { getBranch } from "@/lib/branches/store";
import type { Branch } from "@/lib/branches/types";
import {
  addDays,
  estimateTotal,
  extraGuestTotal,
  firstConflict,
  HORIZON_DAYS,
  nightsOf,
  readBooking,
  shortDate,
  todayKst,
} from "@/lib/reservations/rules";
import { getCalendar, requestReservation } from "@/lib/reservations/store";
import { input } from "@/components/diagnose/styles";
import { Button, ButtonLink, Card, Notice } from "../ui";
import { BookingCalendar, type DayState } from "./booking-calendar";

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

// 숙소 예약 신청 (STY-06, task.md 9.8). 날짜·인원을 골라 신청하면 운영팀이 확인해 확정한다(결제 없음).
export function ReserveForm({ branchId }: { branchId: string }) {
  const user = useAuthUser();
  const memberName = useMemberName(user);
  const [branch, setBranch] = useState<Branch | null | undefined>(undefined);
  const [unavailable, setUnavailable] = useState<Set<string>>(new Set());
  const [checkIn, setCheckIn] = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>(null);
  const [guests, setGuests] = useState(2);
  const [name, setName] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [memo, setMemo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getBranch(branchId), getCalendar(branchId)])
      .then(([b, cal]) => {
        if (cancelled) return;
        setBranch(b);
        setUnavailable(new Set([...cal.blocked, ...cal.booked]));
      })
      .catch(() => !cancelled && setBranch(null));
    return () => {
      cancelled = true;
    };
  }, [branchId]);

  const today = todayKst();
  const booking = readBooking(branch?.content.booking);
  const nights = useMemo(
    () => (checkIn && checkOut ? nightsOf(checkIn, checkOut) : []),
    [checkIn, checkOut],
  );
  const price = {
    weekday: Number(branch?.content.price?.weekday) || 0,
    weekend: Number(branch?.content.price?.weekend) || 0,
  };
  const extraGuests = Math.max(0, guests - booking.baseGuests);
  const extraFee = extraGuestTotal(nights.length, guests, booking);
  const total = estimateTotal(nights, price) + extraFee;

  if (branch === undefined) return <p className="text-base">불러오는 중…</p>;
  if (!branch || branch.sample || !booking.enabled)
    return (
      <Notice tone="neutral" title="지금은 예약 신청을 받지 않습니다">
        <span>숙소 화면의 외부 예약 링크를 이용해 주세요.</span>
        <div>
          <ButtonLink href={`/stay/${branchId}`}>숙소 화면으로</ButtonLink>
        </div>
      </Notice>
    );

  const lastCheckIn = addDays(today, HORIZON_DAYS);
  // 체크아웃 후보: 체크인 다음 날부터 최대 박 수까지, 사이에 막힌 밤이 없을 때
  const validCheckOut = (d: string) => {
    if (!checkIn || d <= checkIn) return false;
    const n = nightsOf(checkIn, d);
    return (
      n.length >= booking.minNights &&
      n.length <= booking.maxNights &&
      !firstConflict(n, unavailable)
    );
  };
  const choosingOut = checkIn !== null && checkOut === null;

  const stateOf = (d: string): DayState => {
    if (d <= today) return "past";
    if (d === checkIn || d === checkOut) return "selected";
    if (checkIn && checkOut && d > checkIn && d < checkOut) return "inRange";
    if (unavailable.has(d) && !(choosingOut && validCheckOut(d)))
      return "blocked";
    return "free";
  };
  const canPick = (d: string) => {
    if (d <= today) return false;
    if (choosingOut && validCheckOut(d)) return true;
    return d <= lastCheckIn && !unavailable.has(d);
  };
  const onPick = (d: string) => {
    setError(null);
    if (choosingOut && validCheckOut(d)) setCheckOut(d);
    else {
      setCheckIn(d);
      setCheckOut(null);
    }
  };

  const guestName = (name ?? memberName ?? "").trim();
  const phoneOk = /^[0-9-+ ]{8,20}$/.test(phone.trim());
  const ready = nights.length > 0 && guestName && phoneOk && user;

  async function submit() {
    if (!checkIn || !checkOut) return;
    setBusy(true);
    setError(null);
    try {
      const id = await requestReservation({
        branchId,
        checkIn,
        checkOut,
        guests,
        guestName,
        phone: phone.trim(),
        memo: memo.trim(),
      });
      trackReserveClick(branchId, "onkiro");
      setDoneId(id);
    } catch (e) {
      // 서버 함수의 안내 문구(막힌 날짜, 신청 수 제한 등)를 그대로 보여준다
      const msg = e instanceof Error ? e.message : "";
      setError(msg || "신청하지 못했습니다. 잠시 뒤 다시 시도해 주세요.");
      setBusy(false);
    }
  }

  if (doneId)
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">예약 신청이 접수되었습니다</h1>
        <p className="text-base text-ink-2">
          운영팀이 날짜를 확인한 뒤 연락드립니다.{" "}
          <b>아직 예약이 확정된 것은 아닙니다.</b> 확정되면 마이페이지에서 입금
          안내를 볼 수 있어요.
        </p>
        <div>
          <ButtonLink href="/me" variant="primary">
            마이페이지로
          </ButtonLink>
        </div>
      </div>
    );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">예약 신청</h1>
        <p className="text-base text-ink-2">
          {branch.content.label || branch.name} · 최대 {booking.maxGuests}인
          {booking.extraGuestFee > 0 &&
            booking.baseGuests < booking.maxGuests &&
            ` (${booking.baseGuests + 1}명부터 1인 1박 ${won(booking.extraGuestFee)} 추가)`}{" "}
          · {booking.minNights > 1 ? `${booking.minNights}~` : "최대 "}
          {booking.maxNights}박
        </p>
      </div>

      <Card>
        <p className="text-lg font-semibold">
          {choosingOut ? "체크아웃 날짜를 고르세요" : "체크인 날짜를 고르세요"}
        </p>
        <BookingCalendar
          start={addDays(today, 1)}
          stateOf={stateOf}
          canPick={canPick}
          onPick={onPick}
        />
        <p className="text-sm text-ink-2">
          줄이 그어진 날은 예약할 수 없습니다. 체크아웃 날은 묵지 않으므로 다음
          손님의 체크인과 겹쳐도 됩니다.
        </p>
      </Card>

      <Card>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-base">
          <dt className="text-ink-2">일정</dt>
          <dd>
            {checkIn ? shortDate(checkIn) : "—"} →{" "}
            {checkOut ? shortDate(checkOut) : "—"}
            {nights.length > 0 && ` (${nights.length}박)`}
          </dd>
          <dt className="text-ink-2">예상 금액</dt>
          <dd>
            {nights.length > 0 && total > 0 ? (
              <>
                <b>{won(total)}</b>
                {extraFee > 0 && (
                  <span className="block text-sm text-ink-2">
                    추가 인원 {extraGuests}명 × {won(booking.extraGuestFee)} ×{" "}
                    {nights.length}박 = {won(extraFee)} 포함
                  </span>
                )}
                <span className="block text-sm text-ink-2">
                  금·토 밤은 주말 요금. 확정 금액은 운영팀이 안내합니다
                </span>
              </>
            ) : (
              "—"
            )}
          </dd>
        </dl>
        <label className="flex flex-col gap-1 text-sm text-ink-2">
          인원
          <select
            className={input}
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
          >
            {Array.from({ length: booking.maxGuests }, (_, i) => i + 1).map(
              (n) => (
                <option key={n} value={n}>
                  {n}명
                </option>
              ),
            )}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink-2">
          예약자 이름
          <input
            className={input}
            value={name ?? memberName ?? ""}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink-2">
          연락처
          <input
            className={input}
            type="tel"
            inputMode="tel"
            placeholder="010-0000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink-2">
          요청 사항 (선택)
          <textarea
            className="min-h-24 w-full rounded-md border border-line-2 bg-surface px-3 py-2 text-base text-ink"
            maxLength={1000}
            placeholder="예: 아이 1명 포함, 늦은 체크인"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </label>
      </Card>

      {booking.policy && (
        <Notice tone="info" title="취소·환불 안내">
          <span className="whitespace-pre-line text-sm">{booking.policy}</span>
        </Notice>
      )}

      {error && (
        <p role="alert" className="text-base text-crit">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/stay/${branchId}`} className="text-base underline">
          숙소 화면으로
        </Link>
        <Button variant="primary" disabled={busy || !ready} onClick={submit}>
          {busy ? "신청 중…" : "예약 신청하기"}
        </Button>
      </div>
    </div>
  );
}
