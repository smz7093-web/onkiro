// 진단 사진 부위 (SIM-06, task.md 6.4). 아래 guide는 기본 문구이고, 촬영 가이드(D9, 해순)는
// 관리 화면 /admin/photo-guides에서 고친다(siteContent/photoGuides). 화면은 photoGuide()로 읽는다.
// 이 파일은 React·Firebase를 import하지 않는다.

export const PHOTO_PARTS = [
  {
    id: "front",
    label: "외관 정면",
    guide:
      "집 전체와 지붕 끝까지 한 장에 나오게, 정면에서 3~5m 떨어져 찍어 주세요. 맑은 낮이 가장 좋습니다(AI 가상 이미지의 원본).",
  },
  {
    id: "back",
    label: "외관 후면",
    guide: "뒤쪽 벽과 처마, 지붕 끝이 함께 나오게 찍어 주세요.",
  },
  {
    id: "left",
    label: "외관 좌측",
    guide:
      "왼쪽 벽 전체가 나오게 찍고, 금이나 물자국이 있으면 가까이서 한 장 더 찍어 주세요.",
  },
  {
    id: "right",
    label: "외관 우측",
    guide:
      "오른쪽 벽 전체가 나오게 찍고, 금이나 물자국이 있으면 가까이서 한 장 더 찍어 주세요.",
  },
  {
    id: "roof",
    label: "지붕",
    guide:
      "지붕 전체가 보이는 위치에서 찍어 주세요(올라가지 마세요). 비가 샌 천장 얼룩도 함께 올려 주세요.",
  },
  {
    id: "kitchen",
    label: "주방",
    guide:
      "싱크대·벽·바닥이 한 장에 나오게 찍고, 곰팡이나 누수 흔적은 가까이서 한 장 더 찍어 주세요.",
  },
  {
    id: "bathroom",
    label: "욕실",
    guide: "변기·세면대·바닥 타일이 한 장에 나오게 찍어 주세요.",
  },
  {
    id: "crack",
    label: "벽체 균열 부위",
    guide:
      "균열 옆에 동전이나 자를 대고, 1m 거리에서 정면으로 찍어 주세요. 금이 없으면 비워 두세요.",
  },
] as const;

export type PhotoPartId = (typeof PHOTO_PARTS)[number]["id"];

export const MAX_PHOTOS = 20;
// 긴 변 기준 크기(px). 검수에 충분하고 업로드가 빠른 크기
export const MAX_PHOTO_EDGE = 1600;
// 저장 용량 상한 (Storage 규칙과 같게 유지)
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

// 부위별 촬영 안내: 관리 화면에서 고친 문구가 있으면 그것, 없으면 기본 문구
export type PhotoGuides = Partial<Record<PhotoPartId, string>>;

export function photoGuide(id: PhotoPartId, guides?: PhotoGuides): string {
  const custom = guides?.[id]?.trim();
  return custom || PHOTO_PARTS.find((p) => p.id === id)!.guide;
}

export function isPhotoPartId(v: unknown): v is PhotoPartId {
  return PHOTO_PARTS.some((p) => p.id === v);
}

// 사진이 하나도 없는 부위 수 → 견적 불확실도 가산 (EstimateInput.missingPhotoParts)
export function missingPhotoParts(parts: PhotoPartId[]): number {
  const have = new Set(parts);
  return PHOTO_PARTS.filter((p) => !have.has(p.id)).length;
}

// 긴 변이 maxEdge를 넘으면 비율을 유지해 줄인다
export function fitWithin(
  width: number,
  height: number,
  maxEdge = MAX_PHOTO_EDGE,
) {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}
