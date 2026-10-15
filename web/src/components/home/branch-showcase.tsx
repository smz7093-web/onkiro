"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { listBranches } from "@/lib/branches/store";
import type { Branch } from "@/lib/branches/types";
import { Card, Pill } from "../ui";

// 홈의 숙소 사진·카드 (COM-01). 숙소 문서는 누구나 읽는다(firestore.rules branches).
let branchesOnce: Promise<Branch[]> | null = null;
function loadBranches() {
  branchesOnce ??= listBranches().catch(() => {
    branchesOnce = null;
    return [];
  });
  return branchesOnce;
}

function useBranches() {
  const [branches, setBranches] = useState<Branch[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    loadBranches().then((b) => !cancelled && setBranches(b));
    return () => {
      cancelled = true;
    };
  }, []);
  return branches;
}

// 홈에 쓸 사진을 숙소 문서 사진 대신 정한다 (PM 지정, 10/15. 원본 Work_for_AI/onkiro1·2.jpeg → public/home, 1600px·메타데이터 제거)
const HOME_CARD_PHOTOS: Record<string, { url: string; caption: string }> = {
  "onkiro-1": { url: "/home/onkiro2.jpg", caption: "다락방" },
};

const photoOf = (b: Branch) =>
  HOME_CARD_PHOTOS[b.id] ?? b.content.photos.find((p) => p.url) ?? null;

// 첫 화면 오른쪽 큰 사진: 1호점 거실 (PM 지정 사진)
export function HeroPhoto() {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-accent-soft md:aspect-[4/5]">
      <Image
        src="/home/onkiro1.jpg"
        alt="온기로 홍성 1호점 거실"
        fill
        priority
        sizes="(min-width: 768px) 440px, 100vw"
        className="object-cover"
      />
      <span className="absolute bottom-3 left-3 rounded-md bg-ink/75 px-2.5 py-1 text-sm text-white">
        온기로 홍성 1호점
      </span>
    </div>
  );
}

// 1·2호점 카드. 문서가 2개보다 적으면 남은 자리는 '준비 중'으로 채운다
export function BranchCards() {
  const branches = useBranches();
  if (branches === null)
    return (
      <div className="grid gap-4 sm:grid-cols-2" aria-busy="true">
        <div className="h-72 rounded-lg bg-surface-2" />
        <div className="h-72 rounded-lg bg-surface-2" />
      </div>
    );
  const shown = branches.slice(0, 2);
  const empty = Math.max(0, 2 - shown.length);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {shown.map((b) => {
        const photo = photoOf(b);
        return (
          <Link
            key={b.id}
            href={`/stay/${b.id}`}
            className="group rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Card className="h-full group-hover:border-accent">
              <div className="aspect-[16/10] overflow-hidden rounded-md bg-accent-soft">
                {photo && (
                  // eslint-disable-next-line @next/next/no-img-element -- Storage 다운로드 URL(토큰 포함)도 올 수 있어 next/image 최적화를 쓰지 않는다
                  <img
                    src={photo.url}
                    alt={`${b.content.label} ${photo.caption}`}
                    className="size-full object-cover"
                  />
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <b className="text-lg">{b.content.label}</b>
                <span className="text-base text-accent">숙소 보기 →</span>
              </div>
              <p className="text-base">{b.content.headline}</p>
              <p className="text-sm text-ink-2">{b.content.summary}</p>
            </Card>
          </Link>
        );
      })}
      {Array.from({ length: empty }, (_, i) => (
        <Card key={`empty-${i}`} variant="flat" className="justify-center">
          <div className="flex aspect-[16/10] items-center justify-center rounded-md border border-dashed border-line-2">
            <Pill tone="ochre">준비 중</Pill>
          </div>
          <b className="text-lg">온기로 홍성 {shown.length + i + 1}호점</b>
          <p className="text-sm text-ink-2">다음 빈집을 고치고 있습니다.</p>
        </Card>
      ))}
    </div>
  );
}
