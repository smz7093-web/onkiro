"use client";

import { useEffect, useState } from "react";
import {
  aiErrorMessage,
  renderRemodel,
  type RenderTarget,
} from "@/lib/ai/store";
import type { ModuleType } from "@/lib/engine/types";
import { FINISH_TIERS } from "@/lib/diagnosis/compute";
import { listPhotos, photoUrl } from "@/lib/diagnosis/photo-store";
import type { PhotoPartId } from "@/lib/diagnosis/photos";
import { useDiagnosis } from "./diagnosis-context";
import { btnSecondary } from "./styles";
import { Pill } from "../ui";

interface PartPhoto {
  id: string;
  url: string;
  createdAt: Date | null;
}

// 그릴 대상 (10/19): 전체 외관·대표 방·욕실·주방. 서버 functions/src/ai/render.ts RENDER_TARGETS와 같다
const TARGETS: {
  id: RenderTarget;
  label: string;
  part: PhotoPartId;
  note: string;
}[] = [
  {
    id: "exterior",
    label: "전체 외관",
    part: "front",
    note: "외관 정면 사진으로 그립니다. 집 크기·층수·지붕 모양은 그대로 두도록 지시합니다.",
  },
  {
    id: "room",
    label: "대표 방",
    part: "room",
    note: "실내 마감 등급(하·중·상)이 적용되는 곳입니다. 방 크기와 벽·창·문 위치는 그대로 두도록 지시합니다.",
  },
  {
    id: "bathroom",
    label: "욕실",
    part: "bathroom",
    note: "욕실 공사비는 등급과 별개로 체크리스트 상태(일부 수리·전면 교체)로 계산됩니다. 그림의 마감 수준은 참고용입니다.",
  },
  {
    id: "kitchen",
    label: "주방",
    part: "kitchen",
    note: "주방 공사비는 등급과 별개로 체크리스트 상태(일부 수리·전면 교체)로 계산됩니다. 그림의 마감 수준은 참고용입니다.",
  },
];

const when = (d: Date | null) =>
  d
    ? d.toLocaleString("ko-KR", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

// 리모델링 후 모습 AI 가상 이미지 (10/15, 10/19 대상 4가지). 사진이 있는 대상만 그릴 수 있다.
// 실제 시공 결과가 아닌 참고 그림이라는 점을 크게 표시한다. 사진이 여러 장이면 고르고 'N장 중 K번째'로 알린다
// (기본은 가장 최근 사진). 대상·등급·사진마다 결과를 따로 저장해 다시 골라도 다시 그리지 않는다.
export function RemodelPreview({ module }: { module: ModuleType }) {
  const { assessment, isTeam } = useDiagnosis();
  const [byPart, setByPart] = useState<Partial<
    Record<PhotoPartId, PartPhoto[]>
  > | null>(null);
  const [target, setTarget] = useState<RenderTarget>("exterior");
  const [selected, setSelected] = useState<
    Partial<Record<RenderTarget, string>>
  >({});
  // `${대상}:${등급}:${사진 id}` → 그린 이미지 주소
  const [after, setAfter] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tier = FINISH_TIERS.find((t) => t.module === module)!;

  useEffect(() => {
    if (!isTeam) return;
    let cancelled = false;
    listPhotos(assessment.id)
      .then(async (photos) => {
        const wanted = new Set(TARGETS.map((t) => t.part));
        const list = await Promise.all(
          photos
            .filter((p) => wanted.has(p.part))
            .map(async (p) => ({
              part: p.part,
              id: p.id,
              url: await photoUrl(p.storagePath),
              createdAt: p.createdAt,
            })),
        );
        const grouped: Partial<Record<PhotoPartId, PartPhoto[]>> = {};
        for (const p of list) (grouped[p.part] ??= []).push(p);
        return grouped;
      })
      .then((grouped) => {
        if (cancelled) return;
        setByPart(grouped);
        // 기본: 대상마다 가장 최근 사진, 처음 보이는 대상은 사진이 있는 첫 대상
        const first: Partial<Record<RenderTarget, string>> = {};
        for (const t of TARGETS) {
          const last = grouped[t.part]?.at(-1);
          if (last) first[t.id] = last.id;
        }
        setSelected(first);
        const firstTarget = TARGETS.find((t) => first[t.id]);
        if (firstTarget) setTarget(firstTarget.id);
      })
      .catch(() => {
        // 사진을 못 읽으면 이 칸을 숨긴다
      });
    return () => {
      cancelled = true;
    };
  }, [assessment.id, isTeam]);

  if (!byPart || !TARGETS.some((t) => (byPart[t.part]?.length ?? 0) > 0))
    return null;

  const t = TARGETS.find((x) => x.id === target)!;
  const photos = byPart[t.part] ?? [];
  const photoId = selected[target];
  const index = photos.findIndex((p) => p.id === photoId);
  const photo = photos[index];

  async function make() {
    if (!photo) return;
    setBusy(true);
    setError(null);
    try {
      const r = await renderRemodel(assessment.id, module, photo.id, target);
      const url = await photoUrl(r.storagePath);
      setAfter((a) => ({ ...a, [`${target}:${module}:${photo.id}`]: url }));
    } catch (e) {
      setError(aiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const img = photo ? after[`${target}:${module}:${photo.id}`] : undefined;
  const which = photo
    ? photos.length > 1
      ? `${t.label} 사진 ${photos.length}장 중 ${index + 1}번째 · ${when(photo.createdAt)} 올림`
      : `${t.label} 사진 · ${when(photo.createdAt)} 올림`
    : "";
  const box = "aspect-[4/3] w-full rounded-lg bg-surface-2 object-contain";

  return (
    <div className="flex flex-col gap-3 border-t border-line pt-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold">리모델링 후 모습 미리보기</h3>
        <Pill tone="warn">AI 가상 이미지 · 실제 시공 결과와 다를 수 있음</Pill>
      </div>

      {/* 대상 고르기: 사진이 없는 대상은 '사진 없음'으로 막는다 */}
      <div role="tablist" aria-label="그릴 곳" className="flex flex-wrap gap-2">
        {TARGETS.map((x) => {
          const n = byPart[x.part]?.length ?? 0;
          const on = x.id === target;
          return (
            <button
              key={x.id}
              type="button"
              role="tab"
              aria-selected={on}
              disabled={n === 0 || busy}
              onClick={() => {
                setTarget(x.id);
                setError(null);
              }}
              className={`inline-flex h-11 items-center rounded-full border px-4 text-base ${
                on
                  ? "border-accent bg-accent text-accent-ink"
                  : "border-line-2 bg-surface text-ink"
              } disabled:opacity-40`}
            >
              {x.label}
              {n === 0 && <span className="ml-1 text-sm">(사진 없음)</span>}
            </button>
          );
        })}
      </div>
      <p className="text-sm text-ink-2">{t.note}</p>

      {photos.length > 1 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-ink-2">
            어느 사진으로 그릴지 고르세요 (처음에는 가장 최근에 올린 사진)
          </p>
          <div
            role="radiogroup"
            aria-label={`AI가 그릴 ${t.label} 사진`}
            className="flex flex-wrap gap-2"
          >
            {photos.map((p, i) => {
              const on = p.id === photoId;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  aria-label={`${i + 1}번째 ${t.label} 사진 · ${when(p.createdAt)} 올림`}
                  disabled={busy}
                  onClick={() => {
                    setSelected((s) => ({ ...s, [target]: p.id }));
                    setError(null);
                  }}
                  className={`relative size-20 overflow-hidden rounded-md border-2 ${
                    on ? "border-accent ring-3 ring-accent-soft" : "border-line"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- Storage 다운로드 URL(토큰 포함) */}
                  <img src={p.url} alt="" className="size-full object-cover" />
                  <span className="absolute top-1 left-1 rounded bg-ink/75 px-1.5 text-xs text-white">
                    {i + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {photo && (
        <div className="grid gap-3 sm:grid-cols-2">
          <figure className="flex flex-col gap-1">
            {/* eslint-disable-next-line @next/next/no-img-element -- Storage 다운로드 URL(토큰 포함)이라 next/image 최적화를 쓰지 않는다 */}
            <img
              src={photo.url}
              alt={`AI가 그릴 현재 ${t.label} 사진`}
              className={box}
            />
            <figcaption className="text-sm text-ink-2">
              지금 모습 — {which}
            </figcaption>
          </figure>
          <figure className="flex flex-col gap-1">
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element -- 위와 같음
              <img
                src={img}
                alt={`${t.label} ${tier.grade}·${tier.name} 리모델링 후 AI 가상 이미지`}
                className={box}
              />
            ) : (
              <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-line-2 bg-surface-2 p-4 text-center">
                <span className="text-base">
                  {t.label}
                  {photos.length > 1 ? ` ${index + 1}번째 사진` : ""}을{" "}
                  {tier.grade}·{tier.name}으로 고친 모습으로 AI가 그려 봅니다
                </span>
                <button
                  type="button"
                  className={btnSecondary}
                  disabled={busy}
                  onClick={make}
                >
                  {busy ? "그리는 중… (10~30초)" : "가상 이미지 만들기"}
                </button>
              </div>
            )}
            <figcaption className="text-sm text-ink-2">
              {t.label} · {tier.grade}·{tier.name} 리모델링 후 (AI 가상)
              {photos.length > 1 ? ` · ${index + 1}번째 사진 기준` : ""}
            </figcaption>
          </figure>
        </div>
      )}
      {error && (
        <p role="alert" className="text-base text-crit">
          {error}
        </p>
      )}
      <p className="text-sm text-ink-2">
        올린 사진을 바탕으로 AI(Google Gemini)가 그린 참고 그림입니다. 실제
        설계·자재·공사비와 연결되지 않으며, 구조·인허가 상태를 반영하지
        않습니다. 그림을 만들기 위해 사진이 Google의 AI 서비스로 전송되니, 실내
        사진에는 사람·가족사진·우편물이 보이지 않게 해 주세요.
      </p>
    </div>
  );
}
