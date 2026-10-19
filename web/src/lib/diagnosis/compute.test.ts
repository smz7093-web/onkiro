import { describe, expect, it } from "vitest";
import {
  ASSUMPTION_V0_3,
  PRICE_V2026_10_1,
  RECOMMENDED_PRICE_TABLE,
} from "../engine/defaults";
import type { ChecklistAnswers } from "../engine/checklist";
import {
  computeEstimate,
  computeScenarios,
  DEFAULT_ESTIMATE_OPTIONS,
  defaultRevenueInput,
  FINISH_TIERS,
  inputsKey,
  snapshotInputs,
  tierEstimates,
  type DiagnosisInputs,
} from "./compute";
import { manualFact } from "./facts";

const CHECKLIST: ChecklistAnswers = {
  leak: "no",
  roofHole: "no",
  water: "yes",
  power: "yes",
  septic: "yes",
  lastOccupied: "within1y",
  crack: "none",
  tilt: "no",
  bathroom: "full",
  kitchen: "full",
  heating: "oil",
};

const INPUTS: DiagnosisInputs = {
  facts: {
    floorArea: manualFact(72),
    bathrooms: manualFact(1),
    kitchens: manualFact(1),
  },
  noRegistry: false,
  checklist: CHECKLIST,
  missingPhotoParts: 0,
  options: DEFAULT_ESTIMATE_OPTIONS,
  region: "hongseong",
};

describe("실내 마감 등급별 견적 (하·중·상 = 모듈 A·B·C)", () => {
  it("실내 마감만 바뀌고 나머지 공정은 같다", () => {
    const c = computeEstimate(INPUTS, PRICE_V2026_10_1);
    const t = tierEstimates(c.estimateInput, PRICE_V2026_10_1);
    // 72㎡ × (A 165,000 / B 208,000 / C 236,000) + 욕실 250 + 주방 200 + IoT 100 + 철거 180만 원(전면 교체 → 자동 포함)
    expect(t.A.subtotal).toBeCloseTo(72 * 165_000 + 7_300_000, 0);
    expect(t.B.subtotal).toBeCloseTo(c.estimate.subtotal, 0);
    expect(t.C.subtotal).toBeCloseTo(72 * 236_000 + 7_300_000, 0);
    expect(t.A.total).toBeLessThan(t.B.total);
    expect(t.B.total).toBeLessThan(t.C.total);
    expect(FINISH_TIERS.map((x) => x.grade)).toEqual(["하", "중", "상"]);
  });
});

describe("진단 → 견적", () => {
  it("기본 정보·체크리스트·옵션을 견적 입력으로 옮긴다", () => {
    const c = computeEstimate(INPUTS, PRICE_V2026_10_1);
    expect(c.estimateInput).toMatchObject({
      floorArea: 72,
      bathrooms: 1,
      module: "B",
      // 욕실·주방 '전면 교체'가 있으니 철거를 자동 포함 (10/19)
      optionalBaseWork: ["demolition"],
      conditions: { bathroom: "full", kitchen: "full" },
    });
    // 욕실 250 + 주방 200 + 모듈 B 72㎡ 1,497.6 + IoT 100 + 철거 180 = 2,227.6만 원
    expect(c.estimate.subtotal).toBeCloseTo(22_276_000, 0);
    expect(c.expertRequired).toBe(false);
  });

  it("사진 누락·대장 없음은 불확실도를 넓힌다", () => {
    const c = computeEstimate(
      { ...INPUTS, missingPhotoParts: 8, noRegistry: true },
      PRICE_V2026_10_1,
    );
    expect(c.estimate.uncertainty).toBeCloseTo(0.15 + 0.4 + 0.1, 10);
  });

  it("철거를 고르면 철거 기본 공사가 들어간다", () => {
    const c = computeEstimate(
      { ...INPUTS, options: { module: "B", demolition: true } },
      PRICE_V2026_10_1,
    );
    expect(c.estimate.processes.map((p) => p.id)).toContain("demolition");
  });
});

describe("수익 3안", () => {
  it("가정값 기본값에서 3안을 계산한다", () => {
    const s = computeScenarios(
      defaultRevenueInput(ASSUMPTION_V0_3),
      33_000_000,
      ASSUMPTION_V0_3,
    );
    expect(s.conservative.occupancy).toBeCloseTo(0.45, 10);
    expect(Math.round(s.base.net / 10_000)).toBe(195);
  });
});

describe("스냅샷 입력 지문 (SIM-20)", () => {
  const make = (over: Partial<DiagnosisInputs> = {}) => {
    const c = computeEstimate({ ...INPUTS, ...over }, PRICE_V2026_10_1);
    return snapshotInputs(
      c.estimateInput,
      CHECKLIST,
      defaultRevenueInput(ASSUMPTION_V0_3),
      PRICE_V2026_10_1,
      ASSUMPTION_V0_3,
    );
  };

  it("같은 입력이면 같은 지문", () => {
    expect(inputsKey(make())).toBe(inputsKey(make()));
  });

  it("키 순서가 달라도 같은 지문", () => {
    const a = make();
    const b = { ...a, revenueInput: { ...a.revenueInput } };
    const reordered = Object.fromEntries(
      Object.entries(b.revenueInput).reverse(),
    ) as typeof b.revenueInput;
    expect(inputsKey({ ...b, revenueInput: reordered })).toBe(inputsKey(a));
  });

  it("입력이 바뀌면 다른 지문", () => {
    expect(inputsKey(make({ missingPhotoParts: 1 }))).not.toBe(
      inputsKey(make()),
    );
  });
});

describe("10/19 확정 규칙", () => {
  it("모두 양호하고 1년 안에 살던 집은 철거를 자동으로 넣지 않는다", () => {
    const good = {
      ...INPUTS,
      checklist: { ...INPUTS.checklist, bathroom: "usable", kitchen: "usable" },
    } as typeof INPUTS;
    const c = computeEstimate(good, PRICE_V2026_10_1);
    expect(c.estimateInput.optionalBaseWork).toEqual([]);
  });

  it("5년 넘게 빈 집은 철거 자동 포함, 외부·조경은 고를 때만", () => {
    const old = {
      ...INPUTS,
      checklist: { ...INPUTS.checklist, lastOccupied: "over10y" },
      options: { module: "B", demolition: false, exterior: true },
    } as typeof INPUTS;
    const c = computeEstimate(old, RECOMMENDED_PRICE_TABLE);
    expect(c.estimateInput.optionalBaseWork).toEqual([
      "demolition",
      "exterior",
    ]);
    // 확정 판정표: 10년 이상 → 설비·단열 전면 교체
    expect(c.checklist.conditions).toMatchObject({
      electrical: "full",
      insulation: "full",
    });
  });

  it("확인 화면 지붕이 슬레이트면 slateRoof", () => {
    const slate = {
      ...INPUTS,
      facts: {
        ...INPUTS.facts,
        roofStructure: { value: "슬레이트", source: "manual" },
      },
    } as typeof INPUTS;
    expect(
      computeEstimate(slate, PRICE_V2026_10_1).estimateInput.slateRoof,
    ).toBe(true);
  });
});
