import type { User } from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../firebase/client";
import {
  DEFAULT_PERMIT_CONTENT,
  type PermitContent,
} from "../diagnosis/permits";
import type { PhotoGuides } from "../diagnosis/photos";
import { readPermitContent, readPhotoGuides } from "./content";
import {
  DEFAULT_LAW_CHANGE,
  readLawChange,
  type LawChange,
} from "./law-change";

// 관리 화면에서 고치는 화면 문구 (siteContent, firestore.rules). 누구나 읽고, 권한자만 고친다.
// permits = 인허가 간이 확인(D7, 가정값 또는 콘텐츠 편집 권한), photoGuides = 촬영 가이드(D9, 콘텐츠 편집 권한)

export interface Edited<T> {
  value: T;
  updatedByName: string | null;
  updatedAt: Date | null;
}

async function read<T>(
  id: "permits" | "photoGuides" | "lawChange",
  parse: (raw: unknown) => T,
): Promise<Edited<T>> {
  const snap = await getDoc(doc(db, "siteContent", id));
  const data = snap.exists() ? snap.data() : null;
  return {
    value: parse(data),
    updatedByName: (data?.updatedByName as string) ?? null,
    updatedAt:
      data?.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : null,
  };
}

export const loadPermitContent = () => read("permits", readPermitContent);
export const loadPhotoGuides = () => read("photoGuides", readPhotoGuides);
export const loadLawChange = () => read("lawChange", readLawChange);

const stamp = (user: User, userName: string | null) => ({
  updatedBy: user.uid,
  updatedByName: userName,
  updatedAt: serverTimestamp(),
});

export async function savePermitContent(
  content: PermitContent,
  user: User,
  userName: string | null,
) {
  await setDoc(doc(db, "siteContent", "permits"), {
    general: content.general,
    conditional: content.conditional,
    ...stamp(user, userName),
  });
}

export async function savePhotoGuides(
  guides: PhotoGuides,
  user: User,
  userName: string | null,
) {
  await setDoc(doc(db, "siteContent", "photoGuides"), {
    guides,
    ...stamp(user, userName),
  });
}

// 시행 예정 법 개정 참고 (siteContent/lawChange, 10/31). 인허가 문구와 같은 권한
export async function saveLawChange(
  content: LawChange,
  user: User,
  userName: string | null,
) {
  await setDoc(doc(db, "siteContent", "lawChange"), {
    enabled: content.enabled,
    title: content.title,
    note: content.note,
    items: content.items,
    ...stamp(user, userName),
  });
}

// 홈 첫 화면 큰 사진 (siteContent/home, 10/23). 숙소 편집의 사진에서 고르고, 콘텐츠 편집 권한자만 바꾼다.
export interface HomeHero {
  url: string;
  caption: string;
  // 사진 위에 표시하는 숙소 이름
  label: string;
  branchId: string | null;
}

// 고르기 전 기본값: 1호점 거실 (PM 지정, 10/15. 원본 Work_for_AI/onkiro1.jpeg → public/home)
export const DEFAULT_HOME_HERO: HomeHero = {
  url: "/home/onkiro1.jpg",
  caption: "거실",
  label: "온기로 홍성 1호점",
  branchId: "onkiro-1",
};

function readHomeHero(raw: unknown): HomeHero {
  const h = (raw as { hero?: Record<string, unknown> } | null)?.hero;
  if (!h || typeof h.url !== "string" || !h.url) return DEFAULT_HOME_HERO;
  return {
    url: h.url,
    caption: typeof h.caption === "string" ? h.caption : "",
    label: typeof h.label === "string" ? h.label : "",
    branchId: typeof h.branchId === "string" ? h.branchId : null,
  };
}

export async function loadHomeHero(): Promise<HomeHero> {
  const snap = await getDoc(doc(db, "siteContent", "home"));
  return readHomeHero(snap.exists() ? snap.data() : null);
}

export async function saveHomeHero(
  hero: HomeHero,
  user: User,
  userName: string | null,
) {
  await setDoc(doc(db, "siteContent", "home"), {
    hero,
    ...stamp(user, userName),
  });
  heroOnce = null;
}

let heroOnce: Promise<HomeHero> | null = null;

// 홈 화면용: 읽기 전에는 null(자리만), 실패하면 기본 사진
export function useHomeHero(): HomeHero | null {
  const [h, setH] = useState<HomeHero | null>(null);
  useEffect(() => {
    let cancelled = false;
    heroOnce ??= loadHomeHero().catch(() => {
      heroOnce = null;
      return DEFAULT_HOME_HERO;
    });
    heroOnce.then((v) => !cancelled && setH(v));
    return () => {
      cancelled = true;
    };
  }, []);
  return h;
}

// 진단·리포트 화면용: 읽기 전에는 기본 문구, 읽기에 실패해도 기본 문구로 계속 보인다
let permitsOnce: Promise<PermitContent> | null = null;
let guidesOnce: Promise<PhotoGuides> | null = null;
let lawOnce: Promise<LawChange> | null = null;

export function usePermitContent(): PermitContent {
  const [c, setC] = useState(DEFAULT_PERMIT_CONTENT);
  useEffect(() => {
    let cancelled = false;
    permitsOnce ??= loadPermitContent().then(
      (r) => r.value,
      () => {
        permitsOnce = null;
        return DEFAULT_PERMIT_CONTENT;
      },
    );
    permitsOnce.then((v) => !cancelled && setC(v));
    return () => {
      cancelled = true;
    };
  }, []);
  return c;
}

export function usePhotoGuides(): PhotoGuides {
  const [g, setG] = useState<PhotoGuides>({});
  useEffect(() => {
    let cancelled = false;
    guidesOnce ??= loadPhotoGuides().then(
      (r) => r.value,
      () => {
        guidesOnce = null;
        return {};
      },
    );
    guidesOnce.then((v) => !cancelled && setG(v));
    return () => {
      cancelled = true;
    };
  }, []);
  return g;
}

export function useLawChange(): LawChange {
  const [c, setC] = useState(DEFAULT_LAW_CHANGE);
  useEffect(() => {
    let cancelled = false;
    lawOnce ??= loadLawChange().then(
      (r) => r.value,
      () => {
        lawOnce = null;
        return DEFAULT_LAW_CHANGE;
      },
    );
    lawOnce.then((v) => !cancelled && setC(v));
    return () => {
      cancelled = true;
    };
  }, []);
  return c;
}

// 관리 화면에서 저장하면 다음 화면부터 새 문구를 읽게 한다
export function forgetSiteContent() {
  permitsOnce = null;
  guidesOnce = null;
  lawOnce = null;
}
