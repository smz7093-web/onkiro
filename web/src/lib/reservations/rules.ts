// 숙소 예약 신청 (STY-06, task.md 9.8): 날짜·요금 계산과 상태 이름.
// 서버 검증은 functions/src/reservation.ts가 한다. 날짜 계산은 그 파일과 같게 유지한다.
// 이 파일은 React·Firebase를 import하지 않는다.

export const RESERVATION_STATUSES = [
  "requested",
  "confirmed",
  "rejected",
  "cancelled",
] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  requested: "확인 중",
  confirmed: "예약 확정",
  rejected: "예약 불가",
  cancelled: "취소",
};

// 지점 문서 content.booking (관리 화면 '숙소'에서 켠다)
export interface BookingSettings {
  enabled: boolean;
  maxGuests: number;
  // 기준 인원. 넘는 인원은 1인 1박마다 extraGuestFee를 더한다 (10/23, 1호점: 6명·2만 원)
  baseGuests: number;
  extraGuestFee: number;
  minNights: number;
  maxNights: number;
  // 확정 후 안내 (예: 입금 계좌·기한). 확정된 예약에만 보인다
  paymentGuide: string;
  // 취소·환불 규정 등 신청 화면 안내
  policy: string;
}

export const DEFAULT_BOOKING: BookingSettings = {
  enabled: false,
  maxGuests: 4,
  baseGuests: 4,
  extraGuestFee: 0,
  minNights: 1,
  maxNights: 7,
  paymentGuide: "",
  policy: "",
};

// 오늘부터 며칠 뒤까지 신청을 받는가
export const HORIZON_DAYS = 180;

const DAY = 86_400_000;
const toTime = (d: string) => Date.parse(`${d}T00:00:00Z`);
const fromTime = (t: number) => new Date(t).toISOString().slice(0, 10);

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
    paymentGuide: typeof b.paymentGuide === "string" ? b.paymentGuide : "",
    policy: typeof b.policy === "string" ? b.policy : "",
  };
}

// 묵는 밤 중 막힌 첫 날짜
export function firstConflict(
  nights: readonly string[],
  unavailable: ReadonlySet<string>,
): string | null {
  return nights.find((n) => unavailable.has(n)) ?? null;
}

// 달력 한 달: 일요일부터 시작하는 주 단위 칸(앞뒤 빈칸은 null)
export function monthCells(year: number, month: number): (string | null)[] {
  const first = `${year}-${String(month).padStart(2, "0")}-01`;
  const lead = new Date(toTime(first)).getUTCDay();
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (string | null)[] = Array(lead).fill(null);
  for (let i = 0; i < days; i++) cells.push(addDays(first, i));
  while (cells.length % 7) cells.push(null);
  return cells;
}

// "11월 6일(금)"
export function shortDate(d: string): string {
  const dt = new Date(toTime(d));
  const w = "일월화수목금토"[dt.getUTCDay()];
  return `${dt.getUTCMonth() + 1}월 ${dt.getUTCDate()}일(${w})`;
}
