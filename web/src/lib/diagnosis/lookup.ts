// 외부 조회 결과를 확인 단계 값에 합친다 (task.md 4.3~4.5, 6.3).
// 형태는 functions/src/external/lookup.ts의 PropertyLookup과 같다.
// 이 파일은 React·Firebase를 import하지 않는다.

import {
  manualFact,
  type Fact,
  type FactKey,
  type Facts,
  type FactSource,
} from "./facts";

export type LookupSource =
  "buildingRegistry" | "vworld" | "tourApi" | "juso" | "demoFixture";

export type Outcome<T> =
  | { ok: true; value: T; source: LookupSource; fetchedAt: string }
  | { ok: false; error: string };

export interface BuildingFacts {
  floorArea: number | null;
  landArea: number | null;
  structure: string | null;
  roofStructure: string | null;
  approvalDate: string | null;
}

export interface LandFacts {
  landCategory: string | null;
  zoning: string | null;
  officialLandPrice: number | null;
  priceYear: string | null;
  // 토지면적(㎡). 10/14 추가 — 이전 캐시·저장 데이터에는 없을 수 있다
  landArea?: number | null;
}

export interface TourSpot {
  title: string;
  distanceKm: number;
}

export interface PropertyLookup {
  building: Outcome<{ found: boolean; facts: BuildingFacts }>;
  land: Outcome<LandFacts>;
  tour: Outcome<TourSpot[]>;
}

// 빈집 문서에 남기는 주변 관광지 (SIM-04 시연판: 직선거리)
export interface Nearby {
  spots: TourSpot[];
  source: LookupSource;
  fetchedAt: string;
}

const factSource = (s: LookupSource): FactSource =>
  s === "demoFixture"
    ? "demoFixture"
    : s === "vworld"
      ? "vworld"
      : "buildingRegistry";

// 사용자가 이미 값을 넣은 칸은 건드리지 않는다. 비어 있거나(결측) 아직 없는 칸만 조회값으로 채운다.
function fill(
  facts: Facts,
  key: FactKey,
  value: number | string | null,
  source: FactSource,
  fetchedAt: string,
) {
  const cur = facts[key];
  if (cur && cur.value !== null) return;
  const f: Fact = {
    value,
    source,
    fetchedAt,
    userEdited: false,
    originalValue: null,
  };
  facts[key] =
    value === null && !cur ? { ...manualFact(null), source, fetchedAt } : f;
}

export interface MergeResult {
  facts: Facts;
  nearby: Nearby | null;
  // 대장 조회는 됐는데 건물이 없을 때 (화면이 '대장 없음' 선택을 권한다)
  registryNotFound: boolean;
  // 출처별 실패 메시지 (화면에 '직접 입력해 주세요'와 함께 보여준다)
  failures: { source: "building" | "land" | "tour"; error: string }[];
}

export function mergeLookup(
  current: Facts,
  lookup: PropertyLookup,
): MergeResult {
  const facts: Facts = { ...current };
  const failures: MergeResult["failures"] = [];
  let registryNotFound = false;

  if (lookup.building.ok) {
    const { found, facts: b } = lookup.building.value;
    registryNotFound = !found;
    if (found) {
      const s = factSource(lookup.building.source);
      const at = lookup.building.fetchedAt;
      fill(facts, "floorArea", b.floorArea, s, at);
      fill(facts, "landArea", b.landArea, s, at);
      fill(facts, "structure", b.structure, s, at);
      fill(facts, "roofStructure", b.roofStructure, s, at);
      fill(facts, "approvalDate", b.approvalDate, s, at);
    }
  } else failures.push({ source: "building", error: lookup.building.error });

  if (lookup.land.ok) {
    const s = factSource(lookup.land.source);
    const at = lookup.land.fetchedAt;
    fill(facts, "landCategory", lookup.land.value.landCategory, s, at);
    fill(facts, "zoning", lookup.land.value.zoning, s, at);
    fill(
      facts,
      "officialLandPrice",
      lookup.land.value.officialLandPrice,
      s,
      at,
    );
    // 대장에 대지면적이 없을 때만 토지면적으로 채운다 (대장 값이 먼저 들어가 있으면 건드리지 않는다)
    fill(facts, "landArea", lookup.land.value.landArea ?? null, s, at);
  } else failures.push({ source: "land", error: lookup.land.error });

  const nearby = lookup.tour.ok
    ? {
        spots: lookup.tour.value,
        source: lookup.tour.source,
        fetchedAt: lookup.tour.fetchedAt,
      }
    : null;
  if (!lookup.tour.ok)
    failures.push({ source: "tour", error: lookup.tour.error });

  return { facts, nearby, registryNotFound, failures };
}
