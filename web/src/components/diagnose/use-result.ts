"use client";

import { useEffect, useMemo, useState } from "react";
import { ASSUMPTION_V0_3, PRICE_V2026_10_1 } from "@/lib/engine/defaults";
import {
  CHECKLIST_QUESTIONS,
  type ChecklistAnswers,
} from "@/lib/engine/checklist";
import type {
  AssumptionSet,
  PriceTable,
  RevenueInput,
} from "@/lib/engine/types";
import {
  computeEstimate,
  computeScenarios,
  snapshotInputs,
  type EstimateComputation,
  type EstimateOptions,
} from "@/lib/diagnosis/compute";
import { listPhotos } from "@/lib/diagnosis/photo-store";
import { REQUIRED_PHOTO_PARTS, type PhotoPartId } from "@/lib/diagnosis/photos";
import type { SnapshotPayload } from "@/lib/diagnosis/snapshot-store";
import { loadActiveVersionCached } from "@/lib/versions/store";
import { useDiagnosis } from "./diagnosis-context";

export interface ResultBasis {
  price: PriceTable;
  assumption: AssumptionSet;
  // 적용 버전이 없어 임시 기준값을 쓰는 중이면 true (화면에 표시)
  provisional: boolean;
  missingParts: PhotoPartId[];
}

// 결과 화면의 기준값(적용 버전)과 사진 누락 부위를 읽는다 (task.md 7.1, 7.3)
export function useResultBasis() {
  const { assessment, isTeam } = useDiagnosis();
  const [basis, setBasis] = useState<ResultBasis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      loadActiveVersionCached("price"),
      loadActiveVersionCached("assumption"),
      // 사진 단계를 쓸 수 없는 회원은 모든 부위가 누락이다
      isTeam ? listPhotos(assessment.id) : Promise.resolve([]),
    ])
      .then(([p, a, photos]) => {
        if (cancelled) return;
        const have = new Set(photos.map((x) => x.part));
        setBasis({
          price: (p?.data as PriceTable) ?? PRICE_V2026_10_1,
          assumption: (a?.data as AssumptionSet) ?? ASSUMPTION_V0_3,
          provisional: !p || !a,
          // 필수 부위만 센다 (선택 부위는 견적 범위에 넣지 않는다)
          missingParts: REQUIRED_PHOTO_PARTS.filter((x) => !have.has(x.id)).map(
            (x) => x.id,
          ),
        });
      })
      .catch(() => !cancelled && setError("기준값을 불러오지 못했습니다."));
    return () => {
      cancelled = true;
    };
  }, [assessment.id, isTeam]);

  return { basis, error };
}

export function isChecklistComplete(
  checklist: Partial<ChecklistAnswers>,
): checklist is ChecklistAnswers {
  return CHECKLIST_QUESTIONS.every((q) => checklist[q.id] !== undefined);
}

// 화면에서 바로 계산한다 (SIM-19: 저장을 기다리지 않는다)
export function useEstimate(
  basis: ResultBasis | null,
  options: EstimateOptions,
): { computation: EstimateComputation | null; error: string | null } {
  const { assessment, property } = useDiagnosis();
  return useMemo(() => {
    if (!basis || !property) return { computation: null, error: null };
    if (!isChecklistComplete(assessment.checklist))
      return { computation: null, error: "체크리스트를 먼저 마쳐 주세요." };
    try {
      return {
        computation: computeEstimate(
          {
            facts: property.facts,
            noRegistry: property.noRegistry,
            checklist: assessment.checklist,
            missingPhotoParts: basis.missingParts.length,
            options,
            region: basis.assumption.region,
          },
          basis.price,
        ),
        error: null,
      };
    } catch (e) {
      return {
        computation: null,
        error: e instanceof Error ? e.message : "견적을 계산하지 못했습니다.",
      };
    }
  }, [basis, property, assessment.checklist, options]);
}

// 스냅샷에 넣을 값 묶음 (수익 입력이 잘못되면 null)
export function buildPayload(
  basis: ResultBasis,
  computation: EstimateComputation,
  checklist: ChecklistAnswers,
  options: EstimateOptions,
  revenueInput: RevenueInput,
): SnapshotPayload | null {
  try {
    const scenarios = computeScenarios(
      revenueInput,
      computation.estimate.total,
      basis.assumption,
    );
    return {
      inputs: snapshotInputs(
        computation.estimateInput,
        checklist,
        revenueInput,
        basis.price,
        basis.assumption,
        computation.site,
      ),
      options,
      estimate: computation.estimate,
      checklistResult: computation.checklist,
      scenarios,
    };
  } catch {
    return null;
  }
}
