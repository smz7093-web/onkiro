import { describe, expect, it } from "vitest";
import { initialFacts, manualFact } from "./facts";
import { mergeLookup, type PropertyLookup } from "./lookup";

const AT = "2026-10-13T05:02:00.000Z";
const LOOKUP: PropertyLookup = {
  building: {
    ok: true,
    source: "buildingRegistry",
    fetchedAt: AT,
    value: {
      found: true,
      facts: {
        floorArea: 72,
        landArea: null,
        structure: "목구조",
        roofStructure: "기와",
        approvalDate: "1978-04-12",
      },
    },
  },
  land: { ok: false, error: "브이월드 시간 초과" },
  tour: {
    ok: true,
    source: "tourApi",
    fetchedAt: AT,
    value: [{ title: "홍주읍성", distanceKm: 8.4 }],
  },
};

describe("외부 조회 → 확인 단계 값", () => {
  it("빈 칸을 조회값으로 채우고 출처·시각을 남긴다", () => {
    const r = mergeLookup(initialFacts(), LOOKUP);
    expect(r.facts.floorArea).toEqual({
      value: 72,
      source: "buildingRegistry",
      fetchedAt: AT,
      userEdited: false,
      originalValue: null,
    });
    expect(r.facts.structure?.value).toBe("목구조");
    // 결측도 출처와 함께 남긴다
    expect(r.facts.landArea).toMatchObject({
      value: null,
      source: "buildingRegistry",
    });
  });

  it("사용자가 이미 넣은 값은 덮어쓰지 않는다", () => {
    const r = mergeLookup(
      { ...initialFacts(), floorArea: manualFact(80) },
      LOOKUP,
    );
    expect(r.facts.floorArea).toEqual(manualFact(80));
    expect(r.facts.bathrooms).toEqual(manualFact(1));
  });

  it("출처별 실패를 알리고, 관광지는 따로 남긴다", () => {
    const r = mergeLookup(initialFacts(), LOOKUP);
    expect(r.failures).toEqual([
      { source: "land", error: "브이월드 시간 초과" },
    ]);
    expect(r.nearby).toEqual({
      spots: [{ title: "홍주읍성", distanceKm: 8.4 }],
      source: "tourApi",
      fetchedAt: AT,
    });
  });

  it("대장 조회 결과가 없으면 '대장 없음'을 권한다", () => {
    const r = mergeLookup(initialFacts(), {
      ...LOOKUP,
      building: {
        ok: true,
        source: "buildingRegistry",
        fetchedAt: AT,
        value: {
          found: false,
          facts: LOOKUP.building.ok
            ? LOOKUP.building.value.facts
            : ({} as never),
        },
      },
    });
    expect(r.registryNotFound).toBe(true);
    expect(r.facts.floorArea).toBeUndefined();
  });

  it("시연용 저장 데이터는 출처를 그대로 표시한다", () => {
    const r = mergeLookup(initialFacts(), {
      ...LOOKUP,
      building: {
        ...LOOKUP.building,
        source: "demoFixture",
      } as PropertyLookup["building"],
    });
    expect(r.facts.floorArea?.source).toBe("demoFixture");
  });
});
