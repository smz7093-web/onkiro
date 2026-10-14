// 외부 API 응답 → 온기로 값 (task.md 4.2~4.5). 건축물대장·TourAPI는 10/12 실제 응답으로 확인했고,
// 도로명주소·카카오·브이월드는 공개 문서 기준이다(키 저장 후 확인, 필드 이름이 다르면 여기만 고친다).
// 이 파일은 네트워크를 쓰지 않는 순수 함수다.

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown) =>
  typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "";
const num = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : Number(str(v).replaceAll(",", ""));
  return Number.isFinite(n) && str(v) !== "" ? n : null;
};

// 공공데이터포털 응답의 item은 한 건이면 객체, 여러 건이면 배열, 없으면 ""이다
export function asList(v: unknown): Obj[] {
  if (Array.isArray(v)) return v.filter(isObj);
  if (isObj(v)) return [v];
  return [];
}

// ── 4.2 도로명주소 검색 (행정안전부 검색API) ──────────────────────────────

export interface AddressCandidate {
  addressRoad: string;
  addressJibun: string | null;
  pnu: string | null;
  // 좌표는 카카오 로컬로 보완한다
  lat: number | null;
  lng: number | null;
}

// PNU = 법정동코드 10자리 + 대지/산(1/2) + 본번 4자리 + 부번 4자리
export function buildPnu(
  admCd: string,
  mtYn: string,
  mainNo: string,
  subNo: string,
): string | null {
  if (!/^\d{10}$/.test(admCd)) return null;
  const main = Number(mainNo);
  const sub = Number(subNo || "0");
  if (!Number.isInteger(main) || !Number.isInteger(sub)) return null;
  return `${admCd}${mtYn === "1" ? "2" : "1"}${String(main).padStart(4, "0")}${String(sub).padStart(4, "0")}`;
}

export function parseJuso(raw: unknown): AddressCandidate[] {
  const results = isObj(raw) && isObj(raw.results) ? raw.results : null;
  const common = results && isObj(results.common) ? results.common : null;
  if (!results || !common) throw new Error("도로명주소 응답 형식이 다릅니다");
  if (str(common.errorCode) !== "0")
    throw new Error(
      `도로명주소 오류 ${str(common.errorCode)}: ${str(common.errorMessage)}`,
    );
  return asList(results.juso).map((j) => ({
    addressRoad: str(j.roadAddr),
    addressJibun: str(j.jibunAddr) || null,
    pnu: buildPnu(str(j.admCd), str(j.mtYn), str(j.lnbrMnnm), str(j.lnbrSlno)),
    lat: null,
    lng: null,
  }));
}

// 카카오 로컬 주소 검색 → 좌표
export function parseKakaoAddress(
  raw: unknown,
): { lat: number; lng: number } | null {
  const doc = isObj(raw) ? asList(raw.documents)[0] : undefined;
  if (!doc) return null;
  const lat = num(doc.y);
  const lng = num(doc.x);
  return lat === null || lng === null ? null : { lat, lng };
}

// ── 4.3 건축물대장 표제부 (국토교통부 건축HUB) ─────────────────────────────

export interface BuildingFacts {
  floorArea: number | null;
  landArea: number | null;
  structure: string | null;
  roofStructure: string | null;
  approvalDate: string | null;
  // 10/14 추가: 지상 층수(지붕 면적 계산), 주용도(인허가 간이 확인)
  floors: number | null;
  mainPurpose: string | null;
}

// 대장의 구조 이름 → 확인 화면 선택지 (lib/diagnosis/facts.ts FACT_DEFS options와 같게)
export function normalizeStructure(name: string): string | null {
  if (!name) return null;
  if (name.includes("목")) return "목구조";
  if (/벽돌|조적|블록|블럭|석조|연와/.test(name)) return "조적조(벽돌·블록)";
  if (/경량철골/.test(name)) return "경량철골";
  if (/철근|콘크리트|RC/i.test(name)) return "철근콘크리트";
  if (/철골/.test(name)) return "경량철골";
  return "기타";
}

export function normalizeRoof(name: string): string | null {
  if (!name) return null;
  if (name.includes("기와")) return "기와";
  if (/슬레이트|스레트|슬레트/.test(name)) return "슬레이트";
  if (/강판|금속|징크|함석|칼라/.test(name)) return "금속(강판)";
  if (/슬래브|콘크리트/.test(name)) return "슬래브";
  return "기타";
}

// 코드 이름이 '기타지붕'·'기타구조'처럼 '기타'로 떨어지면 대장의 비고 칸(etcRoof·etcStrct)을 다시 읽는다
// (실제 응답 예: roofCdNm "기타지붕", etcRoof "스레트, 도단즙")
function withEtc(
  normalize: (name: string) => string | null,
  name: string,
  etc: string,
): string | null {
  const first = normalize(name);
  if (first !== "기타" && first !== null) return first;
  return normalize(etc.split(",")[0].trim()) ?? first;
}

const toDate = (yyyymmdd: string) =>
  /^\d{8}$/.test(yyyymmdd)
    ? `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`
    : null;

// 한 필지에 건물이 여러 동이면 주건축물 중 연면적이 가장 큰 동을 쓴다.
// found=false면 대장이 없다(화면에서 '대장 없음' 안내).
export function parseBuildingTitle(raw: unknown): {
  found: boolean;
  facts: BuildingFacts;
} {
  const body =
    isObj(raw) && isObj(raw.response) && isObj(raw.response.body)
      ? raw.response.body
      : null;
  const header =
    isObj(raw) && isObj(raw.response) && isObj(raw.response.header)
      ? raw.response.header
      : null;
  if (!body) throw new Error("건축물대장 응답 형식이 다릅니다");
  if (header && str(header.resultCode) && str(header.resultCode) !== "00")
    throw new Error(
      `건축물대장 오류 ${str(header.resultCode)}: ${str(header.resultMsg)}`,
    );
  const items = asList(isObj(body.items) ? body.items.item : undefined);
  const empty: BuildingFacts = {
    floorArea: null,
    landArea: null,
    structure: null,
    roofStructure: null,
    approvalDate: null,
    floors: null,
    mainPurpose: null,
  };
  if (items.length === 0) return { found: false, facts: empty };
  const main = items.filter((i) => str(i.mainAtchGbCdNm) !== "부속건축물");
  const pick = (main.length ? main : items).reduce((a, b) =>
    (num(b.totArea) ?? 0) > (num(a.totArea) ?? 0) ? b : a,
  );
  return {
    found: true,
    facts: {
      floorArea: num(pick.totArea) || null,
      landArea: num(pick.platArea) || null,
      structure: withEtc(
        normalizeStructure,
        str(pick.strctCdNm),
        str(pick.etcStrct),
      ),
      roofStructure: withEtc(
        normalizeRoof,
        str(pick.roofCdNm),
        str(pick.etcRoof),
      ),
      approvalDate: toDate(str(pick.useAprDay)),
      floors: num(pick.grndFlrCnt) || null,
      mainPurpose: str(pick.mainPurpsCdNm) || null,
    },
  };
}

// ── 4.4 브이월드 토지특성 ─────────────────────────────────────────────────

export interface LandFacts {
  landCategory: string | null;
  zoning: string | null;
  officialLandPrice: number | null;
  priceYear: string | null;
  // 토지면적(㎡). 대장에 대지면적이 비어 있을 때 쓴다
  landArea: number | null;
  // 10/14 추가: 도로 접면(예: 세로한면(가)), 지형 높이·형상(예: 평지 · 부정형), 토지 이용 상황(예: 단독)
  roadSide: string | null;
  terrain: string | null;
  landUse: string | null;
}

// 여러 해 자료가 오면 가장 최근 기준연도를, 같은 해가 여러 건이면 마지막 갱신일(lastUpdtDt)이 늦은 것을 쓴다
// (10/14 실제 응답: 2013년부터 해마다 1~3건, 오래된 연도부터 온다)
export function parseLandCharacteristics(raw: unknown): LandFacts {
  const root = isObj(raw)
    ? (raw.landCharacteristicss ?? raw.landCharacteristics)
    : undefined;
  if (!isObj(root)) throw new Error("브이월드 응답 형식이 다릅니다");
  const rows = asList(root.field);
  const empty: LandFacts = {
    landCategory: null,
    zoning: null,
    officialLandPrice: null,
    priceYear: null,
    landArea: null,
    roadSide: null,
    terrain: null,
    landUse: null,
  };
  if (rows.length === 0) return empty;
  const order = (r: Obj) => `${str(r.stdrYear)}|${str(r.lastUpdtDt)}`;
  const latest = rows.reduce((a, b) => (order(b) > order(a) ? b : a));
  return {
    landCategory: str(latest.lndcgrCodeNm) || null,
    zoning: str(latest.prposArea1Nm) || null,
    officialLandPrice: num(latest.pblntfPclnd),
    priceYear: str(latest.stdrYear) || null,
    landArea: num(latest.lndpclAr) || null,
    roadSide: str(latest.roadSideCodeNm) || null,
    terrain:
      [str(latest.tpgrphHgCodeNm), str(latest.tpgrphFrmCodeNm)]
        .filter(Boolean)
        .join(" · ") || null,
    landUse: str(latest.ladUseSittnNm) || null,
  };
}

// ── 4.5 TourAPI 주변 관광지 (직선거리, 경로 기준은 11.7) ─────────────────────

export interface TourSpot {
  title: string;
  distanceKm: number;
}

// 두 좌표 사이 직선거리(km)
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) {
  const r = (d: number) => (d * Math.PI) / 180;
  const a =
    Math.sin(r(lat2 - lat1) / 2) ** 2 +
    Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lng2 - lng1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

export function parseTourList(
  raw: unknown,
  lat: number,
  lng: number,
  limit = 3,
): TourSpot[] {
  const body =
    isObj(raw) && isObj(raw.response) && isObj(raw.response.body)
      ? raw.response.body
      : null;
  if (!body) throw new Error("TourAPI 응답 형식이 다릅니다");
  return asList(isObj(body.items) ? body.items.item : undefined)
    .map((i) => {
      const y = num(i.mapy);
      const x = num(i.mapx);
      return y === null || x === null
        ? null
        : { title: str(i.title), distanceKm: haversineKm(lat, lng, y, x) };
    })
    .filter((s): s is TourSpot => s !== null && s.title !== "")
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}
