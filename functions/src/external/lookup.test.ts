import { describe, expect, it } from "vitest";
import {
  buildingParams,
  lookupProperty,
  searchAddress,
  type Deps,
} from "./lookup.js";

const KEYS = { juso: "k", kakao: "k", dataGoKr: "k", vworld: "k" };

function deps(
  over: Partial<Deps> & { responses?: Record<string, unknown> } = {},
): Deps & { calls: string[] } {
  const calls: string[] = [];
  const responses = over.responses ?? {};
  return {
    calls,
    fetchJson: async (_url, { api }) => {
      calls.push(api);
      if (!(api in responses)) throw new Error(`${api} 실패`);
      return responses[api];
    },
    readCache: async () => null,
    writeCache: async () => {},
    now: () => new Date("2026-10-13T00:00:00.000Z"),
    ...over,
  };
}

describe("외부 조회 실패 (시연용 저장 데이터 없음, 11/14)", () => {
  it("예전 시연 주소도 외부를 부르고, 실패하면 실패를 그대로 알린다", async () => {
    const d = deps();
    const s = await searchAddress("홍성군 홍성읍 오관리 595-1", KEYS, d);
    expect(d.calls).toContain("juso");
    expect(s).toMatchObject({ ok: false });
    const r = await lookupProperty(
      { pnu: "4480025021105950001", lat: 36.598, lng: 126.659 },
      KEYS,
      d,
    );
    expect(d.calls).toEqual(
      expect.arrayContaining(["building", "vworld", "tour"]),
    );
    expect(r.building.ok).toBe(false);
    expect(r.land.ok).toBe(false);
    expect(r.tour.ok).toBe(false);
  });

  it("좌표가 없으면 관광지는 조회하지 않고 실패로 알린다", async () => {
    const r = await lookupProperty(
      { pnu: "1111111111100010000", lat: null, lng: null },
      KEYS,
      deps(),
    );
    expect(r.building.ok).toBe(false);
    expect(r.tour).toMatchObject({
      ok: false,
      error: expect.stringContaining("좌표"),
    });
  });
});

describe("출처별로 따로 성공·실패", () => {
  it("대장은 성공, 토지는 실패해도 대장 값은 돌려준다", async () => {
    const d = deps({
      responses: {
        building: {
          response: {
            header: { resultCode: "00" },
            body: { items: { item: { totArea: "60", strctCdNm: "목구조" } } },
          },
        },
      },
    });
    const r = await lookupProperty(
      { pnu: "4480025021103120001", lat: null, lng: null },
      KEYS,
      d,
    );
    expect(r.building).toMatchObject({
      ok: true,
      source: "buildingRegistry",
      fetchedAt: "2026-10-13T00:00:00.000Z",
    });
    expect(r.land.ok).toBe(false);
  });

  it("캐시에 있으면 외부를 부르지 않고 캐시 시각을 쓴다", async () => {
    const d = deps({
      readCache: async <T>() => ({
        value: { found: false, facts: {} } as T,
        fetchedAt: "2026-10-01T00:00:00.000Z",
      }),
    });
    const r = await lookupProperty(
      { pnu: "4480025021103120001", lat: null, lng: null },
      KEYS,
      d,
    );
    expect(d.calls).not.toContain("building");
    expect(r.building).toMatchObject({
      ok: true,
      fetchedAt: "2026-10-01T00:00:00.000Z",
    });
  });

  it("토지 빈 응답은 저장하지 않고 실패로, 예전에 저장된 빈 응답은 무시하고 다시 부른다 (10/20)", async () => {
    const written: string[] = [];
    const d = deps({
      readCache: async <T>(api: string) =>
        api === "land-v2"
          ? {
              value: {
                landCategory: null,
                zoning: null,
                officialLandPrice: null,
                priceYear: null,
                landArea: null,
                roadSide: null,
                terrain: null,
                landUse: null,
              } as T,
              fetchedAt: "2026-10-19T13:08:49.646Z",
            }
          : null,
      writeCache: async (api) => {
        written.push(api);
      },
      responses: { vworld: { landCharacteristicss: { field: [] } } },
    });
    const r = await lookupProperty(
      { pnu: "4480025021105950001", lat: null, lng: null },
      KEYS,
      d,
    );
    expect(d.calls).toContain("vworld");
    expect(r.land).toMatchObject({
      ok: false,
      error: expect.stringContaining("비어 있습니다"),
    });
    expect(written).not.toContain("land-v2");
  });

  it("브이월드 키가 임시값(pending)이면 토지만 건너뛴다", async () => {
    const d = deps();
    const r = await lookupProperty(
      { pnu: "4480025021103120001", lat: null, lng: null },
      { ...KEYS, vworld: "pending" },
      d,
    );
    expect(d.calls).toEqual(["building"]);
    expect(r.land).toMatchObject({ ok: false });
  });

  it("키가 없으면 호출하지 않고 실패로 알린다", async () => {
    const d = deps();
    const r = await searchAddress("홍성군", {}, d);
    expect(d.calls).toEqual([]);
    expect(r).toMatchObject({ ok: false });
  });
});


describe("PNU → 건축물대장 조회 값", () => {
  it("시군구·법정동·대지/산·번·지", () => {
    expect(buildingParams("4480025021203120001")).toEqual({
      sigunguCd: "44800",
      bjdongCd: "25021",
      platGbCd: "1",
      bun: "0312",
      ji: "0001",
    });
  });
});
