import type { User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebase/client";
import type { ReservationStatus } from "./rules";

// 숙소 예약 신청 (STY-06, task.md 9.8). 만들기·상태 변경은 서버 함수, 읽기는 본인·예약 관리 권한자.

export interface Reservation {
  id: string;
  uid: string;
  branchId: string;
  branchName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  guestName: string;
  phone: string;
  // 게스트 요청 사항
  memo: string;
  // 운영팀 메모 (관리 화면에서만)
  staffMemo: string;
  // 신청 당시 요금으로 계산한 예상 금액(원)
  estimate: number;
  status: ReservationStatus;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface ReservationRequest {
  branchId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  guestName: string;
  phone: string;
  memo: string;
}

const toDate = (v: unknown) => (v instanceof Timestamp ? v.toDate() : null);

function toReservation(id: string, d: Record<string, unknown>): Reservation {
  return {
    id,
    uid: d.uid as string,
    branchId: d.branchId as string,
    branchName: (d.branchName as string) ?? (d.branchId as string),
    checkIn: d.checkIn as string,
    checkOut: d.checkOut as string,
    nights: Number(d.nights) || 0,
    guests: Number(d.guests) || 0,
    guestName: (d.guestName as string) ?? "",
    phone: (d.phone as string) ?? "",
    memo: (d.memo as string) ?? "",
    staffMemo: (d.staffMemo as string) ?? "",
    estimate: Number(d.estimate) || 0,
    status: (d.status as ReservationStatus) ?? "requested",
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
  };
}

const newestFirst = (a: Reservation, b: Reservation) =>
  (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0);

export async function requestReservation(
  input: ReservationRequest,
): Promise<string> {
  const res = await httpsCallable<ReservationRequest, { id: string }>(
    functions,
    "requestReservation",
  )(input);
  return res.data.id;
}

export async function updateReservation(
  id: string,
  change: { status?: ReservationStatus; memo?: string },
) {
  await httpsCallable(functions, "updateReservation")({ id, ...change });
}

export async function listMyReservations(uid: string): Promise<Reservation[]> {
  const snap = await getDocs(
    query(collection(db, "reservations"), where("uid", "==", uid)),
  );
  return snap.docs.map((d) => toReservation(d.id, d.data())).sort(newestFirst);
}

// 관리 화면 (관리자·콘텐츠 편집 권한)
export async function listReservations(): Promise<Reservation[]> {
  const snap = await getDocs(
    query(collection(db, "reservations"), orderBy("createdAt", "desc")),
  );
  return snap.docs.map((d) => toReservation(d.id, d.data()));
}

// 접수 알림 배지·준비 현황용
export async function countRequested(): Promise<number> {
  const snap = await getDocs(
    query(collection(db, "reservations"), where("status", "==", "requested")),
  );
  return snap.size;
}

export interface BookingCalendar {
  // 운영팀이 막은 날 (OTA 예약·휴무 등)
  blocked: string[];
  // 확정된 예약의 밤 (서버 함수가 쓴다)
  booked: string[];
}

export async function getCalendar(branchId: string): Promise<BookingCalendar> {
  const snap = await getDoc(doc(db, "bookingCalendars", branchId));
  const d = snap.data() ?? {};
  const list = (v: unknown) =>
    Array.isArray(v)
      ? (v.filter((x) => typeof x === "string") as string[])
      : [];
  return { blocked: list(d.blocked), booked: list(d.booked) };
}

export async function saveBlockedDates(
  branchId: string,
  blocked: string[],
  user: User,
) {
  await setDoc(
    doc(db, "bookingCalendars", branchId),
    {
      blocked: [...new Set(blocked)].sort(),
      updatedBy: user.uid,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
