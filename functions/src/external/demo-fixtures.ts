import type { DemoFixture } from "./lookup.js";

// 시연용 저장 데이터 (task.md 4.6). 대표 주소 2곳의 실제 조회 결과 (10/13 조회).
// savedAt은 실제로 조회해 저장한 시각이다. 화면에는 출처 '시연용 저장 데이터'와 이 시각이 보인다.
// 스위치: Firestore config/demo 문서의 useFixtures (true면 이 주소들은 외부를 부르지 않는다).
// 꺼져 있어도 외부 호출이 실패하면 이 값으로 대신한다.
// 토지(land)는 10/14 브이월드 실제 조회 값(2026년 기준)이다.
// keywords는 검색어에서 공백을 뺀 뒤 포함 여부로 비교한다.
export const DEMO_FIXTURES: DemoFixture[] = [
  {
    // 대표 주소 1 — 광천읍 목조 주택 (대장: 사용승인일·대지면적 없음)
    pnu: "4480025329106280000",
    keywords: ["상정1길21-48", "상정리628"],
    candidate: {
      addressRoad: "충청남도 홍성군 광천읍 상정1길 21-48",
      addressJibun: "충청남도 홍성군 광천읍 상정리 628",
      pnu: "4480025329106280000",
      lat: 36.5078774360244,
      lng: 126.610552664832,
    },
    building: {
      found: true,
      facts: {
        floorArea: 60.76,
        landArea: null,
        structure: "목구조",
        roofStructure: "금속(강판)",
        approvalDate: null,
        floors: 1,
        mainPurpose: "단독주택",
      },
    },
    land: {
      landCategory: "대",
      zoning: "자연녹지지역",
      officialLandPrice: 42700,
      priceYear: "2026",
      landArea: 446,
      roadSide: "세로한면(가)",
      terrain: "평지 · 부정형",
      landUse: "단독",
    },
    tour: [
      { title: "광천생활체육공원", distanceKm: 2.2292774576504573 },
      { title: "광천토굴새우젓단지", distanceKm: 2.555996199180065 },
      { title: "김좌진장군묘", distanceKm: 5.7286850592429595 },
    ],
    savedAt: "2026-10-13T05:21:49.099Z",
  },
  {
    // 대표 주소 2 — 홍성읍 조적조 기와 주택
    pnu: "4480025021105420017",
    keywords: ["충절로1053번길86-9", "오관리542-17"],
    candidate: {
      addressRoad: "충청남도 홍성군 홍성읍 충절로1053번길 86-9",
      addressJibun: "충청남도 홍성군 홍성읍 오관리 542-17",
      pnu: "4480025021105420017",
      lat: 36.5959231201392,
      lng: 126.667214067285,
    },
    building: {
      found: true,
      facts: {
        floorArea: 87.1,
        landArea: null,
        structure: "조적조(벽돌·블록)",
        roofStructure: "기와",
        approvalDate: "1979-11-16",
        floors: 1,
        mainPurpose: "단독주택",
      },
    },
    land: {
      landCategory: "대",
      zoning: "제2종일반주거지역",
      officialLandPrice: 334200,
      priceYear: "2026",
      landArea: 250.6,
      roadSide: "세로한면(가)",
      terrain: "평지 · 부정형",
      landUse: "단독",
    },
    tour: [
      { title: "조양문", distanceKm: 0.7630453309625996 },
      { title: "안회당과 여하정", distanceKm: 0.8000382429536145 },
      { title: "홍주성 천년여행길", distanceKm: 1.2414793724816549 },
    ],
    savedAt: "2026-10-13T05:21:49.324Z",
  },
];
