import { describe, expect, it } from "vitest";
import {
  buildingParams,
  lookupProperty,
  searchAddress,
  type DemoFixture,
  type Deps,
} from "./lookup.js";

const FIXTURE: DemoFixture = {
  pnu: "4480025021103120001",
  keywords: ["홍북읍 테스트로 12"],
  candidate: {
    addressRoad: "충청남도 홍성군 홍북읍 테스트로 12",
    addressJibun: null,
    pnu: "4480025021103120001",
    lat: 36.6,
    lng: 126.66,
  },
  building: {
    found: true,
    facts: {
      floorArea: 72,
      landArea: 330,
      structure: "목구조",
      roofStructure: "기와",
      approvalDate: "1978-04-12",
    },
  },
  land: {
    landCategory: "대",
    zoning: "계획관리지역",
    officialLandPrice: 48200,
    priceYear: "2026",
  },
  tour: [{ title: "홍주읍성", distanceKm: 8.4 }],
  savedAt: "2026-10-12T00:00:00.000Z",
};

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
    fixtures: [FIXTURE],
    useFixtures: false,
    now: () => new Date("2026-10-13T00:00:00.000Z"),
    ...over,
  };
}

describe("시연용 저장 데이터 스위치 (task.md 4.6)", () => {
  it("스위치가 켜져 있으면 저장 데이터 주소는 외부를 부르지 않고 출처를 demoFixture로", async () => {
    const d = deps({ useFixtures: true });
    const r = await lookupProperty(
      { pnu: FIXTURE.pnu, lat: 36.6, lng: 126.66 },
      KEYS,
      d,
    );
    expect(d.calls).toEqual([]);
    expect(r.building).toMatchObject({
      ok: true,
      source: "demoFixture",
      fetchedAt: FIXTURE.savedAt,
    });
    const s = await searchAddress("충남 홍성군 홍북읍 테스트로 12", KEYS, d);
    expect(s).toMatchObject({ ok: true, source: "demoFixture" });
  });

  it("스위치가 꺼져 있어도 외부가 실패하면 저장 데이터로 대신한다", async () => {
    const d = deps();
    const r = await lookupProperty(
      { pnu: FIXTURE.pnu, lat: 36.6, lng: 126.66 },
      KEYS,
      d,
    );
    expect(d.calls.sort()).toEqual(["building", "tour", "vworld"]);
    expect(r.land).toMatchObject({ ok: true, source: "demoFixture" });
  });

  it("저장 데이터가 없는 주소는 실패를 그대로 알린다", async () => {
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
      fixtures: [],
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
      fixtures: [],
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

  it("브이월드 키가 임시값(pending)이면 토지만 건너뛴다", async () => {
    const d = deps({ fixtures: [] });
    const r = await lookupProperty(
      { pnu: "4480025021103120001", lat: null, lng: null },
      { ...KEYS, vworld: "pending" },
      d,
    );
    expect(d.calls).toEqual(["building"]);
    expect(r.land).toMatchObject({ ok: false });
  });

  it("키가 없으면 호출하지 않고 실패로 알린다", async () => {
    const d = deps({ fixtures: [] });
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
