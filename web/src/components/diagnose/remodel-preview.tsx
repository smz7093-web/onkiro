"use client";

import { useEffect, useState } from "react";
import { aiErrorMessage, renderRemodel } from "@/lib/ai/store";
import type { ModuleType } from "@/lib/engine/types";
import { FINISH_TIERS } from "@/lib/diagnosis/compute";
import { listPhotos, photoUrl } from "@/lib/diagnosis/photo-store";
import { useDiagnosis } from "./diagnosis-context";
import { btnSecondary } from "./styles";
import { Pill } from "../ui";

interface FrontPhoto {
  id: string;
  url: string;
  createdAt: Date | null;
}

const when = (d: Date | null) =>
  d
    ? d.toLocaleString("ko-KR", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

// 리모델링 후 모습 AI 가상 이미지 (10/15). 외관 정면 사진이 있을 때만 보인다.
// 실제 시공 결과가 아닌 참고 그림이라는 점을 이미지 위·아래에 크게 표시한다.
// 10/19: 정면 사진이 여러 장이면 어느 사진으로 그릴지 고르고, 고른 사진을 'N장 중 K번째'로 알려준다
// (기본은 가장 최근에 올린 사진). 사진마다 결과를 따로 저장해 바꿔 골라도 다시 그리지 않는다.
export function RemodelPreview({ module }: { module: ModuleType }) {
  const { assessment, isTeam } = useDiagnosis();
  const [fronts, setFronts] = useState<FrontPhoto[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  // `${등급}:${사진 id}` → 그린 이미지 주소
  const [after, setAfter] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tier = FINISH_TIERS.find((t) => t.module === module)!;

  useEffect(() => {
    if (!isTeam) return;
    let cancelled = false;
    listPhotos(assessment.id)
      .then((photos) =>
        Promise.all(
          photos
            .filter((p) => p.part === "front")
            .map(async (p) => ({
              id: p.id,
              url: await photoUrl(p.storagePath),
              createdAt: p.createdAt,
            })),
        ),
      )
      .then((list) => {
        if (cancelled) return;
        setFronts(list);
        setSelected(list.at(-1)?.id ?? null);
      })
      .catch(() => {
        // 사진을 못 읽으면 이 칸을 숨긴다
      });
    return () => {
      cancelled = true;
    };
  }, [assessment.id, isTeam]);

  if (!fronts || fronts.length === 0 || !selected) return null;
  const index = fronts.findIndex((f) => f.id === selected);
  const photo = fronts[index];

  async function make() {
    setBusy(true);
    setError(null);
    try {
      const r = await renderRemodel(assessment.id, module, photo.id);
      const url = await photoUrl(r.storagePath);
      setAfter((a) => ({ ...a, [`${module}:${photo.id}`]: url }));
    } catch (e) {
      setError(aiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const img = after[`${module}:${photo.id}`];
  const which =
    fronts.length > 1
      ? `외관 정면 사진 ${fronts.length}장 중 ${index + 1}번째 · ${when(photo.createdAt)} 올림`
      : `외관 정면 사진 · ${when(photo.createdAt)} 올림`;
  return (
    <div className="flex flex-col gap-3 border-t border-line pt-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold">리모델링 후 모습 미리보기</h3>
        <Pill tone="warn">AI 가상 이미지 · 실제 시공 결과와 다를 수 있음</Pill>
      </div>

      {fronts.length > 1 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-ink-2">
            어느 외관 정면 사진으로 그릴지 고르세요 (처음에는 가장 최근에 올린
            사진)
          </p>
          <div
            role="radiogroup"
            aria-label="AI가 그릴 외관 정면 사진"
            className="flex flex-wrap gap-2"
          >
            {fronts.map((f, i) => {
              const on = f.id === selected;
              return (
                <button
                  key={f.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  aria-label={`${i + 1}번째 정면 사진 · ${when(f.createdAt)} 올림`}
                  disabled={busy}
                  onClick={() => {
                    setSelected(f.id);
                    setError(null);
                  }}
                  className={`relative size-20 overflow-hidden rounded-md border-2 ${
                    on ? "border-accent ring-3 ring-accent-soft" : "border-line"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- Storage 다운로드 URL(토큰 포함) */}
                  <img src={f.url} alt="" className="size-full object-cover" />
                  <span className="absolute top-1 left-1 rounded bg-ink/75 px-1.5 text-xs text-white">
                    {i + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <figure className="flex flex-col gap-1">
          {/* eslint-disable-next-line @next/next/no-img-element -- Storage 다운로드 URL(토큰 포함)이라 next/image 최적화를 쓰지 않는다 */}
          <img
            src={photo.url}
            alt="AI가 그릴 현재 외관 정면 사진"
            className="aspect-[3/4] w-full rounded-lg object-cover"
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
              alt={`${tier.grade}·${tier.name} 리모델링 후 AI 가상 이미지`}
              className="aspect-[3/4] w-full rounded-lg object-cover"
            />
          ) : (
            <div className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-line-2 bg-surface-2 p-4 text-center">
              <span className="text-base">
                {fronts.length > 1 ? `${index + 1}번째 사진을 ` : ""}
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
            {tier.grade}·{tier.name} 리모델링 후 (AI 가상)
            {fronts.length > 1 ? ` · ${index + 1}번째 사진 기준` : ""}
          </figcaption>
        </figure>
      </div>
      {error && (
        <p role="alert" className="text-base text-crit">
          {error}
        </p>
      )}
      <p className="text-sm text-ink-2">
        올린 외관 사진을 바탕으로 AI(Google Gemini)가 그린 참고 그림입니다. 실제
        설계·자재·공사비와 연결되지 않으며, 구조·인허가 상태를 반영하지
        않습니다. 그림을 만들기 위해 사진이 Google의 AI 서비스로 전송됩니다.
      </p>
    </div>
  );
}
