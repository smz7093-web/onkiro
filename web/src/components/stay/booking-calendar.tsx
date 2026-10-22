"use client";

import { useState } from "react";
import { monthCells } from "@/lib/reservations/rules";
import { buttonClass } from "../ui";

export type DayState =
  "free" | "selected" | "inRange" | "blocked" | "booked" | "past";

const DAY_CLASS: Record<DayState, string> = {
  free: "bg-surface text-ink hover:bg-accent-soft",
  selected: "bg-accent text-accent-ink font-semibold",
  inRange: "bg-accent-soft text-ink",
  blocked: "bg-surface-2 text-muted line-through",
  booked: "bg-crit-soft text-crit line-through",
  past: "text-muted opacity-50",
};

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

// 예약 달력 (STY-06). 게스트 날짜 고르기와 관리 화면 날짜 막기에 같이 쓴다.
// 칸마다 상태는 부모가 정한다(stateOf). 누를 수 없는 칸은 canPick이 false.
export function BookingCalendar({
  start,
  monthsShown = 2,
  stateOf,
  canPick,
  onPick,
}: {
  // 처음 보여줄 달의 아무 날짜 (YYYY-MM-DD)
  start: string;
  monthsShown?: number;
  stateOf: (date: string) => DayState;
  canPick: (date: string) => boolean;
  onPick: (date: string) => void;
}) {
  const [offset, setOffset] = useState(0);
  const y0 = Number(start.slice(0, 4));
  const m0 = Number(start.slice(5, 7)) - 1 + offset;
  const months = Array.from({ length: monthsShown }, (_, i) => {
    const t = new Date(Date.UTC(y0, m0 + i, 1));
    return { year: t.getUTCFullYear(), month: t.getUTCMonth() + 1 };
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          className={buttonClass({ variant: "ghost", size: "sm" })}
          disabled={offset <= 0}
          onClick={() => setOffset((o) => o - 1)}
        >
          ← 이전 달
        </button>
        <button
          type="button"
          className={buttonClass({ variant: "ghost", size: "sm" })}
          disabled={offset >= 5}
          onClick={() => setOffset((o) => o + 1)}
        >
          다음 달 →
        </button>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        {months.map(({ year, month }) => (
          <div key={`${year}-${month}`} className="flex flex-col gap-2">
            <p className="text-base font-semibold">
              {year}년 {month}월
            </p>
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              {WEEK.map((w) => (
                <span key={w} className="py-1 text-ink-2">
                  {w}
                </span>
              ))}
              {monthCells(year, month).map((d, i) =>
                d ? (
                  <button
                    key={d}
                    type="button"
                    aria-label={d}
                    aria-pressed={stateOf(d) === "selected"}
                    disabled={!canPick(d)}
                    onClick={() => onPick(d)}
                    className={`h-11 rounded-md text-base disabled:cursor-not-allowed ${DAY_CLASS[stateOf(d)]}`}
                  >
                    {Number(d.slice(8))}
                  </button>
                ) : (
                  <span key={`e${i}`} />
                ),
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
