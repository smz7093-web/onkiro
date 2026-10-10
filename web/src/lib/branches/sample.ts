import type { Branch } from "./types";

// 화면 개발용 샘플 (목업 stay-detail 문구). 실제 숙소가 아니다.
// D12가 오면 Firestore branches 문서로 넣고, 이 샘플은 문서가 없을 때만 쓴다.
export const SAMPLE_BRANCHES: Branch[] = [
  {
    id: "sample-1",
    name: "샘플 1호점",
    airbnbUrl: null,
    naverUrl: null,
    sample: true,
    content: {
      label: "온기로 홍성 1호점",
      headline: "감나무집 · 1978년 목구조 한옥 독채",
      summary: "최대 4인 · 침실 2 · 욕실 1 · 마당 · 주차 2대",
      photos: [
        { url: "", caption: "마당과 감나무" },
        { url: "", caption: "대청" },
        { url: "", caption: "침실" },
        { url: "", caption: "욕실" },
        { url: "", caption: "주방" },
      ],
      cleaning: {
        headline: "체크아웃마다 전문 청소",
        detail: "침구 매회 교체 · 욕실·주방 소독 · 월 1회 해충 방제",
      },
      amenities: [
        "소화기",
        "연기 감지기",
        "외부 CCTV (실내 없음)",
        "유아 의자·식기",
      ],
      experiences: [
        { name: "짚풀 공예", detail: "마을 장인 · 90분 · 1인 2만 원" },
        { name: "마을 산책 투어", detail: "마을 해설사 · 60분 · 무료" },
      ],
      location: "홍성군 ○○면 ○○리 · 홍주읍성 차량 12분",
      price: {
        weekday: 200_000,
        weekend: 300_000,
        checkIn: "15:00",
        checkOut: "11:00",
      },
    },
  },
];
