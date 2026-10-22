// 숙소 예약 신청 (STY-06, task.md 9.8). 게스트가 날짜·인원을 골라 신청하고 운영팀이 확인해 확정한다.
// 결제는 하지 않는다(확정 후 입금 안내). 날짜 계산은 web/src/lib/reservations/rules.ts와 같게 유지한다.

export const RESERVATION_STATUSES = [
  "requested",
  "confirmed",
  "rejected",
  "cancelled",
] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

// 지점 문서 content.booking (관리 화면 '숙소'에서 켠다)
export interface BookingSettings {
  enabled: boolean;
  maxGuests: number;
  // 기준 인원. 넘는 인원은 1인 1박마다 extraGuestFee를 더한다 (10/23, 1호점: 6명·2만 원)
  baseGuests: number;
  extraGuestFee: number;
  minNights: number;
  maxNights: number;
}

export const DEFAULT_BOOKING: BookingSettings = {
  enabled: false,
  maxGuests: 4,
  baseGuests: 4,
  extraGuestFee: 0,
  minNights: 1,
  maxNights: 7,
};

// 오늘부터 며칠 뒤까지 신청을 받는가
export const HORIZON_DAYS = 180;
// 한 회원이 동시에 들고 있을 수 있는 '확인 중' 신청 수
export const MAX_OPEN_REQUESTS = 3;

const DAY = 86_400_000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const toTime = (d: string) => Date.parse(`${d}T00:00:00Z`);
const fromTime = (t: number) => new Date(t).toISOString().slice(0, 10);

export function isDate(v: unknown): v is string {
  return typeof v === "string" && DATE_RE.test(v) && fromTime(toTime(v)) === v;
}

export function addDays(d: string, n: number): string {
  return fromTime(toTime(d) + n * DAY);
}

// 한국 날짜 (YYYY-MM-DD)
export function todayKst(now: Date = new Date()): string {
  return fromTime(now.getTime() + 9 * 3_600_000);
}

// 묵는 밤 목록: 체크인 날부터 체크아웃 전날까지
export function nightsOf(checkIn: string, checkOut: string): string[] {
  const out: string[] = [];
  for (let t = toTime(checkIn); t < toTime(checkOut); t += DAY)
    out.push(fromTime(t));
  return out;
}

// 금·토요일 밤은 주말 요금
export function isWeekendNight(d: string): boolean {
  const w = new Date(toTime(d)).getUTCDay();
  return w === 5 || w === 6;
}

export function estimateTotal(
  nights: readonly string[],
  price: { weekday: number; weekend: number },
): number {
  return nights.reduce(
    (sum, n) => sum + (isWeekendNight(n) ? price.weekend : price.weekday),
    0,
  );
}

// 기준 인원을 넘는 인원의 추가 요금: (인원 − 기준 인원) × 1인 1박 요금 × 박 수
export function extraGuestTotal(
  nights: number,
  guests: number,
  b: { baseGuests: number; extraGuestFee: number },
): number {
  return Math.max(0, guests - b.baseGuests) * b.extraGuestFee * nights;
}

export function readBooking(raw: unknown): BookingSettings {
  const b = (typeof raw === "object" && raw !== null ? raw : {}) as Record<
    string,
    unknown
  >;
  const int = (v: unknown, d: number, min: number, max: number) => {
    const n = Number(v);
    return Number.isInteger(n) && n >= min && n <= max ? n : d;
  };
  const minNights = int(b.minNights, DEFAULT_BOOKING.minNights, 1, 30);
  const maxGuests = int(b.maxGuests, DEFAULT_BOOKING.maxGuests, 1, 20);
  return {
    enabled: b.enabled === true,
    maxGuests,
    // 없으면 최대 인원 = 기준 인원(추가 요금 없음)
    baseGuests: Math.min(maxGuests, int(b.baseGuests, maxGuests, 1, 20)),
    extraGuestFee: int(b.extraGuestFee, 0, 0, 1_000_000),
    minNights,
    maxNights: Math.max(
      minNights,
      int(b.maxNights, DEFAULT_BOOKING.maxNights, 1, 30),
    ),
  };
}

export interface RequestInput {
  branchId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  guestName: string;
  phone: string;
  memo: string;
}

// 신청 입력 검증 (지점 설정·오늘 날짜 기준). 막힌 날짜 확인은 따로(firstConflict)
export function parseRequest(
  raw: unknown,
  booking: BookingSettings,
  today: string,
):
  | { ok: true; value: RequestInput; nights: string[] }
  | { ok: false; error: string } {
  if (typeof raw !== "object" || raw === null)
    return { ok: false, error: "입력이 없습니다" };
  const i = raw as Record<string, unknown>;
  if (
    typeof i.branchId !== "string" ||
    !/^[a-z0-9][a-z0-9-]{1,39}$/.test(i.branchId)
  )
    return { ok: false, error: "숙소가 올바르지 않습니다" };
  if (!booking.enabled)
    return { ok: false, error: "이 숙소는 지금 예약 신청을 받지 않습니다" };
  if (!isDate(i.checkIn) || !isDate(i.checkOut))
    return { ok: false, error: "날짜가 올바르지 않습니다" };
  if (i.checkIn <= today)
    return { ok: false, error: "체크인은 내일부터 고를 수 있습니다" };
  if (i.checkIn > addDays(today, HORIZON_DAYS))
    return {
      ok: false,
      error: `${HORIZON_DAYS}일 안의 날짜만 신청할 수 있습니다`,
    };
  const nights = nightsOf(i.checkIn, i.checkOut);
  if (nights.length < booking.minNights)
    return {
      ok: false,
      error: `최소 ${booking.minNights}박부터 신청할 수 있습니다`,
    };
  if (nights.length > booking.maxNights)
    return {
      ok: false,
      error: `최대 ${booking.maxNights}박까지 신청할 수 있습니다`,
    };
  const guests = Number(i.guests);
  if (!Number.isInteger(guests) || guests < 1 || guests > booking.maxGuests)
    return { ok: false, error: `인원은 1~${booking.maxGuests}명입니다` };
  const guestName = typeof i.guestName === "string" ? i.guestName.trim() : "";
  if (!guestName || guestName.length > 40)
    return { ok: false, error: "예약자 이름을 입력해 주세요" };
  const phone = typeof i.phone === "string" ? i.phone.trim() : "";
  if (!/^[0-9-+ ]{8,20}$/.test(phone))
    return { ok: false, error: "연락처가 올바르지 않습니다" };
  const memo = typeof i.memo === "string" ? i.memo.trim() : "";
  if (memo.length > 1000)
    return { ok: false, error: "요청 사항은 1,000자 이하로 써 주세요" };
  return {
    ok: true,
    value: {
      branchId: i.branchId,
      checkIn: i.checkIn,
      checkOut: i.checkOut,
      guests,
      guestName,
      phone,
      memo,
    },
    nights,
  };
}

// 묵는 밤 중 막힌(운영팀이 막은 날 또는 이미 확정된) 첫 날짜
export function firstConflict(
  nights: readonly string[],
  unavailable: Iterable<string>,
): string | null {
  const set = new Set(unavailable);
  return nights.find((n) => set.has(n)) ?? null;
}

// 상태 이동: 확인 중 → 확정·거절·취소, 확정 → 취소. 회원 본인은 확인 중인 신청만 취소한다
export function canChangeStatus(
  from: ReservationStatus,
  to: ReservationStatus,
  actor: "staff" | "owner",
): boolean {
  if (actor === "owner") return from === "requested" && to === "cancelled";
  if (from === "requested")
    return to === "confirmed" || to === "rejected" || to === "cancelled";
  if (from === "confirmed") return to === "cancelled";
  return false;
}

// 예약 관리 권한: 관리자 또는 콘텐츠 편집 권한(숙소 담당) — firestore.rules hasPerm('canEditContent')와 같은 규칙
export function canManageReservations(
  token: Record<string, unknown> | undefined,
): boolean {
  if (!token) return false;
  if (token.role === "admin") return true;
  const perms = token.perms;
  return (
    token.role === "staff" &&
    Array.isArray(perms) &&
    perms.includes("canEditContent")
  );
}
