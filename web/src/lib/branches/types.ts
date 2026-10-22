// 지점(숙소) 문서 branches/{id} (prd.md 8절, STY-01·02).
// 콘텐츠는 D12(해순)로 채우고, 관리자 화면에서 canEditContent 권한자가 고친다(편집 화면은 PM이 나중에).

import type { BookingSettings } from "../reservations/rules";

export interface BranchPhoto {
  // 공개 이미지 주소 (Storage 공개 경로 또는 /public 아래 경로)
  url: string;
  // 사진 설명. 화면에 표시하고 대체 텍스트로도 쓴다
  caption: string;
}

export interface BranchExperience {
  name: string;
  // 예: "마을 장인 · 90분 · 1인 2만 원"
  detail: string;
}

export interface BranchContent {
  // 예: "온기로 홍성 1호점"
  label: string;
  // 예: "감나무집 · 1978년 목구조 한옥 독채"
  headline: string;
  // 예: "최대 4인 · 침실 2 · 욕실 1 · 마당 · 주차 2대"
  summary: string;
  photos: BranchPhoto[];
  cleaning: { headline: string; detail: string };
  // 편의·안전 시설 (예: 소화기, 연기 감지기)
  amenities: string[];
  experiences: BranchExperience[];
  location: string;
  price: {
    // 1박 요금(원)
    weekday: number;
    weekend: number;
    checkIn: string;
    checkOut: string;
  };
  // 온기로 예약 신청 설정 (STY-06). 없으면 꺼짐 — 읽을 때 lib/reservations/rules.ts readBooking을 거친다
  booking?: BookingSettings;
}

export interface Branch {
  id: string;
  name: string;
  content: BranchContent;
  // 외부 예약 링크 (STY-02). 없으면 버튼을 숨긴다
  airbnbUrl: string | null;
  naverUrl: string | null;
  // 샘플 데이터면 true (화면에 "샘플" 표시)
  sample: boolean;
}
