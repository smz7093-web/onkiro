"use client";

import { useEffect, useState } from "react";
import { aiErrorMessage, renderRemodel } from "@/lib/ai/store";
import type { ModuleType } from "@/lib/engine/types";
import { FINISH_TIERS } from "@/lib/diagnosis/compute";
import { listPhotos, photoUrl } from "@/lib/diagnosis/photo-store";
import { useDiagnosis } from "./diagnosis-context";
import { btnSecondary } from "./styles";
import { Pill } from "../ui";

// 리모델링 후 모습 AI 가상 이미지 (10/15). 외관 정면 사진이 있을 때만 보인다.
// 실제 시공 결과가 아닌 참고 그림이라는 점을 이미지 위·아래에 크게 표시한다.
export function RemodelPreview({ module }: { module: ModuleType }) {
  const { assessment, isTeam } = useDiagnosis();
  const [before, setBefore] = useState<string | null>(null);
  const [after, setAfter] = useState<Partial<Record<ModuleType, string>>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tier = FINISH_TIERS.find((t) => t.module === module)!;

  useEffect(() => {
    if (!isTeam) return;
    let cancelled = false;
    listPhotos(assessment.id)
      .then((photos) => {
        const front = photos.filter((p) => p.part === "front").at(-1);
        return front ? photoUrl(front.storagePath) : null;
      })
      .then((url) => !cancelled && setBefore(url))
      .catch(() => {
        // 사진을 못 읽으면 이 칸을 숨긴다
      });
    return () => {
      cancelled = true;
    };
  }, [assessment.id, isTeam]);

  if (!before) return null;

  async function make() {
    setBusy(true);
    setError(null);
    try {
      const r = await renderRemodel(assessment.id, module);
      const url = await photoUrl(r.storagePath);
      setAfter((a) => ({ ...a, [module]: url }));
    } catch (e) {
      setError(aiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const img = after[module];
  return (
    <div className="flex flex-col gap-3 border-t border-line pt-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold">리모델링 후 모습 미리보기</h3>
        <Pill tone="warn">AI 가상 이미지 · 실제 시공 결과와 다를 수 있음</Pill>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <figure className="flex flex-col gap-1">
          {/* eslint-disable-next-line @next/next/no-img-element -- Storage 다운로드 URL(토큰 포함)이라 next/image 최적화를 쓰지 않는다 */}
          <img
            src={before}
            alt="현재 외관 정면 사진"
            className="aspect-[3/4] w-full rounded-lg object-cover"
          />
          <figcaption className="text-sm text-ink-2">지금 모습</figcaption>
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
                {tier.grade}·{tier.name}으로 고친 모습을 AI가 그려 봅니다
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
