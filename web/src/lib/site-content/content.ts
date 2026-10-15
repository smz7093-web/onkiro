// 관리 화면에서 고치는 화면 문구 (siteContent/{permits|photoGuides}, 10/15).
// 저장값을 읽을 때는 빠진 칸을 기본 문구로 채우고, 저장 전에는 길이·개수를 검사한다.
// 이 파일은 React·Firebase를 import하지 않는다.

import {
  CONDITIONAL_PERMITS,
  DEFAULT_PERMIT_CONTENT,
  type PermitContent,
  type PermitText,
} from "../diagnosis/permits";
import { PHOTO_PARTS, type PhotoGuides } from "../diagnosis/photos";

export const LIMITS = {
  title: 120,
  nextAction: 300,
  agency: 80,
  guide: 200,
  generalItems: 12,
};

const str = (v: unknown, max: number) =>
  typeof v === "string" ? v.slice(0, max) : "";

function toText(raw: unknown, fallback: PermitText): PermitText {
  const r = (raw ?? {}) as Record<string, unknown>;
  const title = str(r.title, LIMITS.title).trim();
  const nextAction = str(r.nextAction, LIMITS.nextAction).trim();
  return {
    title: title || fallback.title,
    nextAction: nextAction || fallback.nextAction,
    agency: str(r.agency, LIMITS.agency).trim(),
  };
}

// 저장된 인허가 문구 → 화면에 쓸 내용 (문서가 없거나 칸이 비면 기본 문구)
export function readPermitContent(raw: unknown): PermitContent {
  if (!raw || typeof raw !== "object") return DEFAULT_PERMIT_CONTENT;
  const r = raw as Record<string, unknown>;
  const general = Array.isArray(r.general)
    ? r.general
        .slice(0, LIMITS.generalItems)
        .map((g, i) => {
          const x = (g ?? {}) as Record<string, unknown>;
          const id =
            typeof x.id === "string" && /^[A-Za-z0-9_-]{1,40}$/.test(x.id)
              ? x.id
              : `item${i + 1}`;
          const t = toText(x, { title: "", nextAction: "", agency: "" });
          return { id, ...t };
        })
        .filter((g) => g.title && g.nextAction)
    : DEFAULT_PERMIT_CONTENT.general;
  const c = (r.conditional ?? {}) as Record<string, unknown>;
  const conditional = Object.fromEntries(
    CONDITIONAL_PERMITS.map((p) => [
      p.id,
      toText(c[p.id], DEFAULT_PERMIT_CONTENT.conditional[p.id]),
    ]),
  ) as PermitContent["conditional"];
  return { general, conditional };
}

// 저장 전 검사. 문제가 없으면 빈 배열
export function validatePermitContent(c: PermitContent): string[] {
  const errors: string[] = [];
  if (c.general.length > LIMITS.generalItems)
    errors.push(`모든 집 항목은 ${LIMITS.generalItems}개까지입니다.`);
  const check = (label: string, t: PermitText) => {
    if (!t.title.trim()) errors.push(`${label}: 제목을 입력하세요.`);
    if (!t.nextAction.trim()) errors.push(`${label}: 다음 행동을 입력하세요.`);
    if (t.title.length > LIMITS.title)
      errors.push(`${label}: 제목은 ${LIMITS.title}자까지입니다.`);
    if (t.nextAction.length > LIMITS.nextAction)
      errors.push(`${label}: 다음 행동은 ${LIMITS.nextAction}자까지입니다.`);
    if (t.agency.length > LIMITS.agency)
      errors.push(`${label}: 관할 기관은 ${LIMITS.agency}자까지입니다.`);
    if (/가능합니다|허가 가능|영업 가능/.test(`${t.title} ${t.nextAction}`))
      errors.push(
        `${label}: '가능'으로 판정하는 표현은 쓰지 않습니다(법적 판정 아님).`,
      );
  };
  c.general.forEach((g, i) => check(`모든 집 ${i + 1}번`, g));
  for (const p of CONDITIONAL_PERMITS) {
    const t = c.conditional[p.id];
    check(p.when, t);
    if (p.placeholder && !t.title.includes(p.placeholder))
      errors.push(
        `${p.when}: 제목에 ${p.placeholder}를 넣어야 실제 값이 들어갑니다.`,
      );
  }
  return errors;
}

// 저장된 촬영 안내 → 부위별 문구 (빈 칸은 화면에서 기본 문구로)
export function readPhotoGuides(raw: unknown): PhotoGuides {
  const g = ((raw ?? {}) as Record<string, unknown>).guides;
  if (!g || typeof g !== "object") return {};
  const out: PhotoGuides = {};
  for (const p of PHOTO_PARTS) {
    const v = str((g as Record<string, unknown>)[p.id], LIMITS.guide).trim();
    if (v) out[p.id] = v;
  }
  return out;
}

export function validatePhotoGuides(g: PhotoGuides): string[] {
  return PHOTO_PARTS.filter((p) => (g[p.id] ?? "").length > LIMITS.guide).map(
    (p) => `${p.label}: 안내 문구는 ${LIMITS.guide}자까지입니다.`,
  );
}
