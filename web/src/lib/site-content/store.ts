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

// 관리 화면에서 고치는 화면 문구 (siteContent, firestore.rules). 누구나 읽고, 권한자만 고친다.
// permits = 인허가 간이 확인(D7, 가정값 또는 콘텐츠 편집 권한), photoGuides = 촬영 가이드(D9, 콘텐츠 편집 권한)

export interface Edited<T> {
  value: T;
  updatedByName: string | null;
  updatedAt: Date | null;
}

async function read<T>(
  id: "permits" | "photoGuides",
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

// 진단·리포트 화면용: 읽기 전에는 기본 문구, 읽기에 실패해도 기본 문구로 계속 보인다
let permitsOnce: Promise<PermitContent> | null = null;
let guidesOnce: Promise<PhotoGuides> | null = null;

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

// 관리 화면에서 저장하면 다음 화면부터 새 문구를 읽게 한다
export function forgetSiteContent() {
  permitsOnce = null;
  guidesOnce = null;
}
