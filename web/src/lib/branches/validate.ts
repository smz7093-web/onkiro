// 숙소 콘텐츠 검사 (STY-01·02, task.md 9.3). 관리 화면 저장 전에 쓴다.
// 이 파일은 React·Firebase를 import하지 않는다.

import type { BranchContent } from "./types";

// 문서 id: 주소에 그대로 쓰인다 (/stay/{id}). 영문 소문자·숫자·하이픈만
export function isBranchId(id: string) {
  return /^[a-z0-9][a-z0-9-]{1,39}$/.test(id);
}

const isHttps = (u: string) => {
  try {
    return new URL(u).protocol === "https:";
  } catch {
    return false;
  }
};

export interface BranchDraft {
  name: string;
  content: BranchContent;
  airbnbUrl: string | null;
  naverUrl: string | null;
}

// 저장할 수 없는 이유 목록 (비어 있으면 저장 가능)
export function validateBranch(b: BranchDraft): string[] {
  const errors: string[] = [];
  const c = b.content;
  if (!b.name.trim()) errors.push("지점 이름을 입력해 주세요");
  if (!c.headline.trim()) errors.push("제목을 입력해 주세요");
  if (c.photos.length > 20) errors.push("사진은 20장까지 올릴 수 있습니다");
  c.photos.forEach((p, i) => {
    if (!p.url) errors.push(`사진 ${i + 1}: 파일이 없습니다`);
    if (!p.caption.trim()) errors.push(`사진 ${i + 1}: 설명을 입력해 주세요`);
  });
  c.experiences.forEach((e, i) => {
    if (!e.name.trim()) errors.push(`체험 ${i + 1}: 이름을 입력해 주세요`);
  });
  for (const [label, v] of [
    ["평일 요금", c.price.weekday],
    ["주말 요금", c.price.weekend],
  ] as const) {
    if (!Number.isFinite(v) || v < 0)
      errors.push(`${label}은 0 이상의 숫자여야 합니다`);
  }
  for (const [label, v] of [
    ["체크인", c.price.checkIn],
    ["체크아웃", c.price.checkOut],
  ] as const) {
    if (v && !/^([01]\d|2[0-3]):[0-5]\d$/.test(v))
      errors.push(`${label} 시각은 15:00 형식이어야 합니다`);
  }
  const bk = c.booking;
  if (bk) {
    const ok = (v: number, min: number, max: number) =>
      Number.isInteger(v) && v >= min && v <= max;
    if (!ok(bk.maxGuests, 1, 20)) errors.push("최대 인원은 1~20명입니다");
    else if (!ok(bk.baseGuests, 1, bk.maxGuests))
      errors.push("기준 인원은 1명 이상, 최대 인원 이하여야 합니다");
    if (!ok(bk.extraGuestFee, 0, 1_000_000))
      errors.push("추가 1인 1박 요금은 0~100만 원입니다");
    if (!ok(bk.minNights, 1, 30) || !ok(bk.maxNights, 1, 30))
      errors.push("박 수는 1~30박입니다");
    else if (bk.minNights > bk.maxNights)
      errors.push("최대 박 수는 최소 박 수 이상이어야 합니다");
  }
  for (const [label, u] of [
    ["에어비앤비 링크", b.airbnbUrl],
    ["네이버 예약 링크", b.naverUrl],
  ] as const) {
    if (u && !isHttps(u))
      errors.push(`${label}는 https://로 시작하는 주소여야 합니다`);
  }
  return errors;
}

// 빈 링크는 null로, 앞뒤 공백·빈 편의시설은 지워서 저장한다
export function normalizeBranch(b: BranchDraft): BranchDraft {
  const t = (s: string) => s.trim();
  return {
    name: t(b.name),
    airbnbUrl: b.airbnbUrl && t(b.airbnbUrl) ? t(b.airbnbUrl) : null,
    naverUrl: b.naverUrl && t(b.naverUrl) ? t(b.naverUrl) : null,
    content: {
      ...b.content,
      label: t(b.content.label),
      headline: t(b.content.headline),
      summary: t(b.content.summary),
      location: t(b.content.location),
      amenities: b.content.amenities.map(t).filter(Boolean),
      photos: b.content.photos.map((p) => ({
        url: p.url,
        caption: t(p.caption),
      })),
      experiences: b.content.experiences.map((e) => ({
        name: t(e.name),
        detail: t(e.detail),
      })),
      cleaning: {
        headline: t(b.content.cleaning.headline),
        detail: t(b.content.cleaning.detail),
      },
    },
  };
}
