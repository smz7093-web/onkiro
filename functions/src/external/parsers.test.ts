import { describe, expect, it, vi } from "vitest";
import {
  buildPnu,
  haversineKm,
  normalizeRoof,
  normalizeStructure,
  parseBuildingTitle,
  parseJuso,
  parseKakaoAddress,
  parseLandCharacteristics,
  parseTourList,
} from "./parsers.js";
import { fetchJson, redact } from "./http.js";

vi.mock("firebase-functions", () => ({ logger: { warn: vi.fn() } }));

// 응답 예시는 각 API 공개 문서의 형식을 따른다. 키 발급 후 실제 응답으로 다시 확인한다(task.md 4.2~4.5).

describe("도로명주소 → 후보·PNU", () => {
  const raw = {
    results: {
      common: { errorCode: "0", errorMessage: "정상", totalCount: "1" },
      juso: [
        {
          roadAddr: "충청남도 홍성군 홍북읍 테스트로 12",
          jibunAddr: "충청남도 홍성군 홍북읍 신경리 312-1",
          admCd: "4480025021",
          mtYn: "0",
          lnbrMnnm: "312",
          lnbrSlno: "1",
        },
      ],
    },
  };

  it("PNU는 법정동코드 + 대지/산 + 본번 4자리 + 부번 4자리", () => {
    expect(buildPnu("4480025021", "0", "312", "1")).toBe("4480025021103120001");
    expect(buildPnu("4480025021", "1", "5", "0")).toBe("4480025021200050000");
    expect(buildPnu("448002", "0", "1", "0")).toBeNull();
  });

  it("검색 결과를 후보로 바꾼다", () => {
    expect(parseJuso(raw)).toEqual([
      {
        addressRoad: "충청남도 홍성군 홍북읍 테스트로 12",
        addressJibun: "충청남도 홍성군 홍북읍 신경리 312-1",
        pnu: "4480025021103120001",
        lat: null,
        lng: null,
      },
    ]);
  });

  it("오류 코드는 예외로 알린다", () => {
    expect(() =>
      parseJuso({
        results: {
          common: { errorCode: "E0001", errorMessage: "승인되지 않은 KEY" },
        },
      }),
    ).toThrow(/E0001/);
  });

  it("카카오 좌표", () => {
    expect(
      parseKakaoAddress({ documents: [{ x: "126.66", y: "36.60" }] }),
    ).toEqual({ lat: 36.6, lng: 126.66 });
    expect(parseKakaoAddress({ documents: [] })).toBeNull();
  });
});

describe("건축물대장 표제부", () => {
  const wrap = (item: unknown) => ({
    response: {
      header: { resultCode: "00", resultMsg: "NORMAL SERVICE" },
      body: { items: { item } },
    },
  });

  it("주건축물 중 연면적이 가장 큰 동을 쓴다", () => {
    const r = parseBuildingTitle(
      wrap([
        { mainAtchGbCdNm: "부속건축물", totArea: "120", strctCdNm: "철골구조" },
        {
          mainAtchGbCdNm: "주건축물",
          totArea: "72.4",
          platArea: "330",
          strctCdNm: "목구조",
          roofCdNm: "기와",
          useAprDay: "19780412",
        },
      ]),
    );
    expect(r).toEqual({
      found: true,
      facts: {
        floorArea: 72.4,
        landArea: 330,
        structure: "목구조",
        roofStructure: "기와",
        approvalDate: "1978-04-12",
      },
    });
  });

  it("한 건이면 객체로 와도 읽고, 빈 값은 결측(null)", () => {
    const r = parseBuildingTitle(
      wrap({ totArea: "60", platArea: "", strctCdNm: "", useAprDay: "" }),
    );
    expect(r.facts).toEqual({
      floorArea: 60,
      landArea: null,
      structure: null,
      roofStructure: null,
      approvalDate: null,
    });
  });

  it("결과가 없으면 대장 없음", () => {
    expect(
      parseBuildingTitle({
        response: { header: { resultCode: "00" }, body: { items: "" } },
      }).found,
    ).toBe(false);
  });

  it("실제 응답 형식(10/12 확인): 숫자는 숫자로, '기타지붕'이면 비고 칸을 읽는다", () => {
    const r = parseBuildingTitle(
      wrap({
        mainAtchGbCdNm: "주건축물",
        platArea: 0,
        totArea: 9453.87,
        strctCdNm: "철근콘크리트구조",
        etcStrct: "철근콩크리트조, 목조, 연와조",
        roofCdNm: "기타지붕",
        etcRoof: "스레트, 도단즙",
        useAprDay: "19260905",
      }),
    );
    expect(r.facts).toEqual({
      floorArea: 9453.87,
      landArea: null,
      structure: "철근콘크리트",
      roofStructure: "슬레이트",
      approvalDate: "1926-09-05",
    });
  });

  it("구조·지붕 이름을 선택지로 맞춘다", () => {
    expect(normalizeStructure("시멘트블럭조")).toBe("조적조(벽돌·블록)");
    expect(normalizeStructure("철근콘크리트구조")).toBe("철근콘크리트");
    expect(normalizeStructure("일반목구조")).toBe("목구조");
    expect(normalizeRoof("(철근)콘크리트")).toBe("슬래브");
    expect(normalizeRoof("칼라강판")).toBe("금속(강판)");
    expect(normalizeStructure("연와조")).toBe("조적조(벽돌·블록)");
    expect(normalizeRoof("기타지붕")).toBe("기타");
  });
});

describe("브이월드 토지특성", () => {
  it("가장 최근 기준연도의 지목·용도지역·공시지가", () => {
    const r = parseLandCharacteristics({
      landCharacteristicss: {
        field: [
          {
            stdrYear: "2025",
            lndcgrCodeNm: "대",
            prposArea1Nm: "계획관리지역",
            pblntfPclnd: "45000",
          },
          {
            stdrYear: "2026",
            lndcgrCodeNm: "대",
            prposArea1Nm: "계획관리지역",
            pblntfPclnd: "48200",
          },
        ],
      },
    });
    expect(r).toEqual({
      landCategory: "대",
      zoning: "계획관리지역",
      officialLandPrice: 48200,
      priceYear: "2026",
      landArea: null,
    });
  });

  it("실제 응답 형식(10/14 확인): 같은 해 여러 건이면 마지막 갱신분, 토지면적", () => {
    const row = (
      stdrYear: string,
      lastUpdtDt: string,
      pblntfPclnd: string,
    ) => ({
      stdrYear,
      lastUpdtDt,
      pblntfPclnd,
      lndcgrCodeNm: "대",
      prposArea1Nm: "제2종일반주거지역",
      lndpclAr: "250.6",
    });
    const r = parseLandCharacteristics({
      landCharacteristicss: {
        totalCount: "4",
        resultCode: "",
        field: [
          row("2025", "2025-08-06", "331900"),
          row("2026", "2026-05-12", "334200"),
          row("2026", "2026-03-01", "300000"),
          row("2024", "2025-01-16", "328700"),
        ],
      },
    });
    expect(r).toEqual({
      landCategory: "대",
      zoning: "제2종일반주거지역",
      officialLandPrice: 334200,
      priceYear: "2026",
      landArea: 250.6,
    });
  });
});

describe("TourAPI 주변 관광지", () => {
  it("직선거리 가까운 순 3곳", () => {
    const r = parseTourList(
      {
        response: {
          header: { resultCode: "0000", resultMsg: "OK" },
          body: {
            items: {
              item: [
                { title: "남당항", mapx: "126.47", mapy: "36.53" },
                { title: "홍주읍성", mapx: "126.66", mapy: "36.60" },
                { title: "용봉산", mapx: "126.62", mapy: "36.66" },
                { title: "먼 곳", mapx: "127.5", mapy: "37.5" },
              ],
            },
          },
        },
      },
      36.6,
      126.66,
    );
    expect(r.map((s) => s.title)).toEqual(["홍주읍성", "용봉산", "남당항"]);
    expect(r[0].distanceKm).toBeCloseTo(0, 5);
  });

  it("직선거리 계산 (홍성읍 → 서울 시청 약 110km)", () => {
    expect(haversineKm(36.6, 126.66, 37.5665, 126.978)).toBeGreaterThan(100);
  });
});

describe("공통 호출", () => {
  it("로그에 키가 남지 않도록 쿼리를 지운다", () => {
    expect(redact("https://x.kr/api?confmKey=SECRET&q=1")).toBe(
      "https://x.kr/api",
    );
  });

  it("실패하면 한 번 더 시도하고, 두 번째에 성공하면 결과를 돌려준다", async () => {
    let calls = 0;
    const fake = (async () => {
      calls++;
      return calls === 1
        ? new Response("err", { status: 500 })
        : new Response('{"ok":true}');
    }) as typeof fetch;
    await expect(
      fetchJson("https://x.kr", { api: "t", fetchImpl: fake }),
    ).resolves.toEqual({ ok: true });
    expect(calls).toBe(2);
  });

  it("JSON이 아닌 응답(키 오류 XML 등)은 parse 오류", async () => {
    const fake = (async () =>
      new Response("<OpenAPI_ServiceResponse>")) as typeof fetch;
    await expect(
      fetchJson("https://x.kr", { api: "t", retries: 0, fetchImpl: fake }),
    ).rejects.toMatchObject({
      kind: "parse",
    });
  });

  it("시간 안에 응답이 없으면 timeout", async () => {
    const never = ((_u: string, init?: RequestInit) =>
      new Promise((_, reject) =>
        init?.signal?.addEventListener("abort", () =>
          reject(new Error("aborted")),
        ),
      )) as typeof fetch;
    await expect(
      fetchJson("https://x.kr", {
        api: "t",
        retries: 0,
        timeoutMs: 20,
        fetchImpl: never,
      }),
    ).rejects.toMatchObject({ kind: "timeout" });
  });
});
