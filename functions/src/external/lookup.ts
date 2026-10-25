// 주소 검색·빈집 정보 조회 (task.md 4.1~4.6). 외부 API → 캐시 → 시연용 저장 데이터 순서를 정한다.
// - 시연 스위치(config/demo.useFixtures)가 켜져 있으면 저장 데이터가 있는 주소는 외부를 부르지 않는다.
// - 외부 호출이 실패해도 저장 데이터가 있으면 그것으로 대신한다. 저장 데이터는 출처를 demoFixture로 표시한다.
// - 출처별(대장·토지·관광)로 따로 실패할 수 있다. 하나가 실패해도 나머지는 돌려준다(화면은 실패한 값만 직접 입력).

import {
  parseBuildingTitle,
  parseJuso,
  parseKakaoAddress,
  parseLandCharacteristics,
  parseTourList,
  type AddressCandidate,
  type BuildingFacts,
  type LandFacts,
  type TourSpot,
} from "./parsers.js";

export const ENDPOINTS = {
  juso: "https://business.juso.go.kr/addrlink/addrLinkApi.do",
  kakaoAddress: "https://dapi.kakao.com/v2/local/search/address.json",
  building: "https://apis.data.go.kr/1613000/BldRgstHubService/getBrTitleInfo",
  vworldLand: "https://api.vworld.kr/ned/data/getLandCharacteristics",
  tour: "https://apis.data.go.kr/B551011/KorService2/locationBasedList2",
};

// 브이월드 키는 신청할 때 적은 서비스 주소(도메인)에 묶여 있다.
// https://를 붙이면 400 Bad Request가 난다(10/14 확인) — 호스트 이름만 보낸다
export const VWORLD_DOMAIN = "onkiro-web--onkiro-2fe12.asia-east1.hosted.app";

export type Source =
  "buildingRegistry" | "vworld" | "tourApi" | "juso" | "demoFixture";

export interface Sourced<T> {
  ok: true;
  value: T;
  source: Source;
  fetchedAt: string;
}
export interface Failed {
  ok: false;
  error: string;
}
export type Outcome<T> = Sourced<T> | Failed;

export interface DemoFixture {
  // 이 주소로 판단한다: PNU가 같거나, 검색어가 keywords 중 하나를 포함
  pnu: string;
  keywords: string[];
  candidate: AddressCandidate;
  building: { found: boolean; facts: BuildingFacts };
  land: LandFacts;
  tour: TourSpot[];
  // 실제 저장한 날짜 (화면 '조회 시점'에 그대로 쓴다)
  savedAt: string;
}

export interface Keys {
  juso?: string;
  kakao?: string;
  dataGoKr?: string;
  vworld?: string;
}

export interface Deps {
  fetchJson: (
    url: string,
    opts: { api: string; headers?: Record<string, string> },
  ) => Promise<unknown>;
  readCache: <T>(
    api: string,
    key: string,
    maxAgeDays: number,
  ) => Promise<{ value: T; fetchedAt: string } | null>;
  writeCache: (api: string, key: string, value: unknown) => Promise<void>;
  fixtures: DemoFixture[];
  useFixtures: boolean;
  now: () => Date;
}

const CACHE_DAYS = { juso: 7, building: 30, land: 30, tour: 30 };
// 캐시 이름. 응답에서 꺼내는 값이 늘면 이름을 바꿔 이전 캐시를 쓰지 않는다 (10/14: 층수·주용도·도로 접면 등 추가)
// tour: 반경 20km 결과 (10/25 잠시 10km·tour-v2로 바꿨다가 20km로 되돌림)
const CACHE_API = { building: "building-v2", land: "land-v2", tour: "tour" };

// 주변 관광지 조회 반경(m). 사업계획서 2-1도 '반경 20km'로 맞춘다 (PM 결정 10/25)
export const TOUR_RADIUS_M = 20_000;

const qs = (params: Record<string, string | number>) =>
  new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)]),
  ).toString();

const fail = (e: unknown): Failed => ({
  ok: false,
  error: e instanceof Error ? e.message : String(e),
});

function fixtureFor(
  fixtures: DemoFixture[],
  by: { pnu?: string | null; keyword?: string },
) {
  return fixtures.find(
    (f) =>
      (by.pnu && f.pnu === by.pnu) ||
      (by.keyword &&
        f.keywords.some((k) =>
          containsAddress(by.keyword!.replace(/\s/g, ""), k.replace(/\s/g, "")),
        )),
  );
}

// 검색어에 주소가 들어 있는지. 번지 뒤에 숫자가 더 붙으면 다른 필지다 ('오관리595-1' ≠ '오관리595-10', 10/19)
function containsAddress(text: string, address: string) {
  for (
    let i = text.indexOf(address);
    i !== -1;
    i = text.indexOf(address, i + 1)
  ) {
    const next = text[i + address.length];
    if (next === undefined || !/[0-9-]/.test(next)) return true;
  }
  return false;
}

// 캐시 → 외부 호출 → 캐시 저장
async function cached<T>(
  deps: Deps,
  api: string,
  key: string,
  days: number,
  source: Source,
  load: () => Promise<T>,
  // 빈 응답이면 저장하지 않고 실패로 본다. 예전에 저장된 빈 응답도 쓰지 않는다 (10/20)
  isEmpty?: (value: T) => boolean,
): Promise<Sourced<T>> {
  const hit = await deps.readCache<T>(api, key, days).catch(() => null);
  if (hit && !isEmpty?.(hit.value))
    return { ok: true, value: hit.value, source, fetchedAt: hit.fetchedAt };
  const value = await load();
  if (isEmpty?.(value)) throw new Error(`${api} 응답이 비어 있습니다`);
  await deps.writeCache(api, key, value).catch(() => {});
  return { ok: true, value, source, fetchedAt: deps.now().toISOString() };
}

// ── 4.2 주소 검색 ──────────────────────────────────────────────────────────

export async function searchAddress(
  keyword: string,
  keys: Keys,
  deps: Deps,
): Promise<Outcome<AddressCandidate[]>> {
  const fixture = fixtureFor(deps.fixtures, { keyword });
  const fromFixture = (): Sourced<AddressCandidate[]> => ({
    ok: true,
    value: [fixture!.candidate],
    source: "demoFixture",
    fetchedAt: fixture!.savedAt,
  });
  if (fixture && deps.useFixtures) return fromFixture();
  try {
    if (!keys.juso) throw new Error("도로명주소 API 키가 없습니다");
    return await cached(
      deps,
      "juso",
      keyword.replace(/\s+/g, " ").trim(),
      CACHE_DAYS.juso,
      "juso",
      async () => {
        const raw = await deps.fetchJson(
          `${ENDPOINTS.juso}?${qs({ confmKey: keys.juso!, currentPage: 1, countPerPage: 10, keyword, resultType: "json" })}`,
          { api: "juso" },
        );
        const list = parseJuso(raw);
        // 좌표 보완(카카오). 실패해도 후보는 돌려준다
        if (keys.kakao) {
          await Promise.all(
            list.slice(0, 5).map(async (c) => {
              try {
                const k = await deps.fetchJson(
                  `${ENDPOINTS.kakaoAddress}?${qs({ query: c.addressRoad })}`,
                  {
                    api: "kakaoAddress",
                    headers: { Authorization: `KakaoAK ${keys.kakao}` },
                  },
                );
                const xy = parseKakaoAddress(k);
                if (xy) Object.assign(c, xy);
              } catch {
                // 좌표 없이 진행 (관광지 조회만 빠진다)
              }
            }),
          );
        }
        return list;
      },
    );
  } catch (e) {
    return fixture ? fromFixture() : fail(e);
  }
}

// ── 4.3~4.5 빈집 정보 조회 ─────────────────────────────────────────────────

export interface PropertyLookup {
  building: Outcome<{ found: boolean; facts: BuildingFacts }>;
  land: Outcome<LandFacts>;
  tour: Outcome<TourSpot[]>;
}

// PNU 19자리 → 건축물대장 조회 파라미터
export function buildingParams(pnu: string) {
  return {
    sigunguCd: pnu.slice(0, 5),
    bjdongCd: pnu.slice(5, 10),
    platGbCd: pnu[10] === "2" ? "1" : "0",
    bun: pnu.slice(11, 15),
    ji: pnu.slice(15, 19),
  };
}

export async function lookupProperty(
  input: { pnu: string | null; lat: number | null; lng: number | null },
  keys: Keys,
  deps: Deps,
): Promise<PropertyLookup> {
  const fixture = fixtureFor(deps.fixtures, { pnu: input.pnu });
  const fx = <T>(value: T): Sourced<T> => ({
    ok: true,
    value,
    source: "demoFixture",
    fetchedAt: fixture!.savedAt,
  });
  if (fixture && deps.useFixtures) {
    return {
      building: fx(fixture.building),
      land: fx(fixture.land),
      tour: fx(fixture.tour),
    };
  }
  const orFixture = <T>(e: unknown, pick: (f: DemoFixture) => T): Outcome<T> =>
    fixture ? fx(pick(fixture)) : fail(e);
  const pnu = input.pnu;

  const building = (async (): Promise<PropertyLookup["building"]> => {
    try {
      if (!pnu)
        throw new Error("필지번호(PNU)가 없어 건축물대장을 조회할 수 없습니다");
      if (!keys.dataGoKr) throw new Error("공공데이터포털 API 키가 없습니다");
      return await cached(
        deps,
        CACHE_API.building,
        pnu,
        CACHE_DAYS.building,
        "buildingRegistry",
        async () =>
          parseBuildingTitle(
            await deps.fetchJson(
              `${ENDPOINTS.building}?${qs({ serviceKey: keys.dataGoKr!, ...buildingParams(pnu), _type: "json", numOfRows: 20, pageNo: 1 })}`,
              { api: "building" },
            ),
          ),
      );
    } catch (e) {
      return orFixture(e, (f) => f.building);
    }
  })();

  const land = (async (): Promise<PropertyLookup["land"]> => {
    try {
      if (!pnu)
        throw new Error("필지번호(PNU)가 없어 토지정보를 조회할 수 없습니다");
      // 'pending'은 승인 전 임시값(배포 도구가 선언된 키를 모두 요구한다)
      if (!keys.vworld || keys.vworld === "pending")
        throw new Error("브이월드 API 키가 없습니다");
      return await cached(
        deps,
        CACHE_API.land,
        pnu,
        CACHE_DAYS.land,
        "vworld",
        async () =>
          parseLandCharacteristics(
            await deps.fetchJson(
              `${ENDPOINTS.vworldLand}?${qs({ key: keys.vworld!, domain: VWORLD_DOMAIN, pnu, format: "json", numOfRows: 100, pageNo: 1 })}`,
              { api: "vworld" },
            ),
          ),
        // 10/19 오관리 595-1: 브이월드가 한 번 빈 응답을 줘서 30일간 토지 값이 모두 비어 보였다
        (v) => Object.values(v).every((x) => x === null),
      );
    } catch (e) {
      return orFixture(e, (f) => f.land);
    }
  })();

  const tour = (async (): Promise<PropertyLookup["tour"]> => {
    try {
      const { lat, lng } = input;
      if (lat === null || lng === null)
        throw new Error("좌표가 없어 주변 관광지를 조회할 수 없습니다");
      if (!keys.dataGoKr) throw new Error("공공데이터포털 API 키가 없습니다");
      const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
      return await cached(
        deps,
        CACHE_API.tour,
        key,
        CACHE_DAYS.tour,
        "tourApi",
        async () =>
          parseTourList(
            await deps.fetchJson(
              `${ENDPOINTS.tour}?${qs({
                serviceKey: keys.dataGoKr!,
                MobileOS: "ETC",
                MobileApp: "onkiro",
                _type: "json",
                mapX: lng,
                mapY: lat,
                radius: TOUR_RADIUS_M,
                contentTypeId: 12,
                arrange: "E",
                numOfRows: 30,
                pageNo: 1,
              })}`,
              { api: "tour" },
            ),
            lat,
            lng,
          ),
      );
    } catch (e) {
      return orFixture(e, (f) => f.tour);
    }
  })();

  return { building: await building, land: await land, tour: await tour };
}
