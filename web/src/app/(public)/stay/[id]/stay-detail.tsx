"use client";

import { useEffect, useState } from "react";
import { ButtonLink, Card, Notice, Pill } from "@/components/ui";
import { trackReserveClick } from "@/lib/analytics";
import { getBranch } from "@/lib/branches/store";
import type { Branch, BranchPhoto } from "@/lib/branches/types";
import { readBooking } from "@/lib/reservations/rules";

// 숙소 상세 (STY-01·02, 목업 stay-detail). 데이터는 branches/{id} 하나에 모두 들어 있다(lib/branches/types.ts).
// 예약은 외부(에어비앤비·네이버) 링크로 보내고 클릭 수를 기록한다. 링크가 없으면 그 버튼은 숨긴다.
// 관리 화면에서 예약 신청을 켜면 '온기로에서 예약 신청'(STY-06)이 맨 위 주요 버튼이 된다.

const manwon = (won: number) =>
  `${(won / 10_000).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}만 원`;

// 요금은 저장 형식에 따라 문자열로 올 수 있다
const toWon = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export function StayDetail({ id }: { id: string }) {
  const [branch, setBranch] = useState<Branch | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    getBranch(id)
      .then((b) => !cancelled && setBranch(b))
      .catch(() => !cancelled && setBranch(null));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (branch === undefined)
    return (
      <main
        className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8"
        aria-busy="true"
      >
        <div className="aspect-[16/9] rounded-lg bg-surface-2" />
        <div className="h-8 w-2/3 rounded bg-surface-2" />
        <div className="h-40 rounded-lg bg-surface-2" />
      </main>
    );
  if (branch === null)
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-start gap-4 px-4 py-16">
        <h1 className="text-2xl font-semibold">숙소를 찾을 수 없습니다</h1>
        <ButtonLink href="/">홈으로</ButtonLink>
      </main>
    );

  const c = branch.content;
  const photos = c.photos.filter((p) => p.url);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-6 md:py-8">
      {branch.sample && (
        <Notice tone="info">
          화면 확인용 샘플 숙소입니다. 실제 숙소가 아닙니다.
        </Notice>
      )}

      <Gallery photos={photos} label={c.label} />

      {/* 휴대폰: 제목 → 요금·예약 → 상세 순서(시연 때 바로 보이게). 데스크톱: 요금·예약이 오른쪽에 따라 붙는다 */}
      <div className="grid items-start gap-6 md:grid-cols-[1fr_320px] md:gap-x-8">
        <div className="flex flex-col gap-2 md:col-start-1 md:row-start-1">
          <p className="text-sm font-semibold text-accent">{c.label}</p>
          <h1 className="text-2xl leading-snug font-bold md:text-3xl">
            {c.headline}
          </h1>
          {c.summary && <p className="text-base text-ink-2">{c.summary}</p>}
        </div>

        <Reserve branch={branch} />

        <div className="flex flex-col gap-6 md:col-start-1 md:row-start-2">
          {c.cleaning?.headline && (
            <Card variant="flat">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">청결 관리</h2>
                <Pill tone="good">{c.cleaning.headline}</Pill>
              </div>
              {c.cleaning.detail && (
                <p className="text-base text-ink-2">{c.cleaning.detail}</p>
              )}
            </Card>
          )}

          {c.amenities.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">편의·안전 시설</h2>
              <ul className="flex flex-wrap gap-2">
                {c.amenities.map((a) => (
                  <li key={a}>
                    <Pill tone="good">{a}</Pill>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {c.experiences.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">함께 하기 좋은 체험</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {c.experiences.map((e) => (
                  <li key={e.name}>
                    <Card variant="flat" className="h-full">
                      <b className="text-base">{e.name}</b>
                      <span className="text-sm text-ink-2">{e.detail}</span>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {c.location && (
            <Card variant="flat">
              <h2 className="text-lg font-semibold">위치</h2>
              <p className="text-base whitespace-pre-line text-ink-2">
                {c.location}
              </p>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}

// 사진: 첫 장은 크게, 다음 4장은 작게. 사진이 더 있으면 '사진 모두 보기'로 펼친다
function Gallery({ photos, label }: { photos: BranchPhoto[]; label: string }) {
  const [all, setAll] = useState(false);
  if (photos.length === 0)
    return (
      <div className="flex aspect-[16/9] items-center justify-center rounded-lg bg-accent-soft text-base text-ink-2">
        사진 준비 중
      </div>
    );
  const [first, ...rest] = photos;
  return (
    <section aria-label="숙소 사진" className="flex flex-col gap-3">
      <div className="grid gap-2 md:h-[440px] md:grid-cols-[2fr_1fr_1fr] md:grid-rows-2">
        <Photo
          photo={first}
          label={label}
          className="aspect-[4/3] md:row-span-2 md:aspect-auto"
          eager
        />
        {rest.slice(0, 4).map((p, i) => (
          <Photo
            key={`${p.url}-${i}`}
            photo={p}
            label={label}
            className="hidden md:block"
          />
        ))}
      </div>
      {/* 휴대폰: 나머지 사진은 옆으로 밀어 본다 */}
      {rest.length > 0 && (
        <ul className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 md:hidden">
          {rest.map((p, i) => (
            <li key={`${p.url}-m-${i}`} className="w-3/5 flex-none snap-start">
              <Photo photo={p} label={label} className="aspect-[4/3]" />
            </li>
          ))}
        </ul>
      )}
      {photos.length > 5 && (
        <div className="hidden md:block">
          <button
            type="button"
            className="h-12 text-base text-accent underline"
            onClick={() => setAll(!all)}
            aria-expanded={all}
          >
            {all ? "사진 접기" : `사진 모두 보기 (${photos.length}장)`}
          </button>
        </div>
      )}
      {all && (
        <ul className="hidden gap-3 md:grid md:grid-cols-3">
          {photos.map((p, i) => (
            <li key={`${p.url}-all-${i}`}>
              <Photo photo={p} label={label} className="aspect-[4/3]" />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Photo({
  photo,
  label,
  className,
  eager,
}: {
  photo: BranchPhoto;
  label: string;
  className?: string;
  eager?: boolean;
}) {
  return (
    <figure
      className={`relative overflow-hidden rounded-lg bg-surface-2 ${className ?? ""}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- Storage 다운로드 URL(토큰 포함)이라 next/image 최적화를 쓰지 않는다 */}
      <img
        src={photo.url}
        alt={`${label} ${photo.caption}`}
        loading={eager ? "eager" : "lazy"}
        className="size-full object-cover"
      />
      {photo.caption && (
        <figcaption className="absolute bottom-2 left-2 rounded-md bg-ink/75 px-2 py-0.5 text-sm text-white">
          {photo.caption}
        </figcaption>
      )}
    </figure>
  );
}

// 요금·예약 (STY-02). 데스크톱은 오른쪽에 따라 붙는다
function Reserve({ branch }: { branch: Branch }) {
  const p = branch.content.price;
  const weekday = toWon(p?.weekday);
  const weekend = toWon(p?.weekend);
  const low = Math.min(weekday ?? Infinity, weekend ?? Infinity);
  const high = Math.max(weekday ?? 0, weekend ?? 0);
  const links = [
    {
      channel: "airbnb" as const,
      url: branch.airbnbUrl,
      label: "에어비앤비에서 예약",
    },
    {
      channel: "naver" as const,
      url: branch.naverUrl,
      label: "네이버 예약에서 예약",
    },
  ].filter((l) => l.url);
  const direct = !branch.sample && readBooking(branch.content.booking).enabled;

  return (
    <Card className="md:sticky md:top-4 md:col-start-2 md:row-span-2 md:row-start-1">
      {high > 0 && (
        <p className="text-base">
          <b className="text-2xl">
            {low === high ? manwon(high) : `${manwon(low)}~${manwon(high)}`}
          </b>{" "}
          / 1박
        </p>
      )}
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-base">
        {weekday && (
          <>
            <dt className="text-ink-2">평일</dt>
            <dd>{manwon(weekday)}</dd>
          </>
        )}
        {weekend && (
          <>
            <dt className="text-ink-2">주말</dt>
            <dd>{manwon(weekend)}</dd>
          </>
        )}
        {p?.checkIn && (
          <>
            <dt className="text-ink-2">체크인</dt>
            <dd>{p.checkIn}</dd>
          </>
        )}
        {p?.checkOut && (
          <>
            <dt className="text-ink-2">체크아웃</dt>
            <dd>{p.checkOut}</dd>
          </>
        )}
      </dl>
      {direct && (
        <div className="flex flex-col gap-2">
          <ButtonLink
            href={`/stay/${branch.id}/reserve`}
            variant="primary"
            block
          >
            온기로에서 예약 신청
          </ButtonLink>
          <p className="text-sm text-ink-2">
            날짜를 골라 신청하면 운영팀이 확인 후 확정·입금 안내를 드립니다.
          </p>
        </div>
      )}
      {links.length > 0 ? (
        <div className="flex flex-col gap-2">
          {links.map((l, i) => (
            <ButtonLink
              key={l.channel}
              href={l.url!}
              target="_blank"
              rel="noopener noreferrer"
              variant={i === 0 && !direct ? "primary" : "secondary"}
              block
              onClick={() => trackReserveClick(branch.id, l.channel)}
            >
              {l.label}
            </ButtonLink>
          ))}
          <p className="text-sm text-ink-2">
            예약은 외부 사이트에서 진행됩니다. 체험은 예약 후 문의해 주세요.
          </p>
        </div>
      ) : (
        !direct && <Notice tone="neutral">예약 링크를 준비 중입니다.</Notice>
      )}
    </Card>
  );
}
