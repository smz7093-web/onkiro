import { describe, expect, it } from "vitest";
import { ASSUMPTION_V0_3, PRICE_V2026_10_1 } from "../engine/defaults";
import type { ChecklistAnswers } from "../engine/checklist";
import {
  computeEstimate,
  computeScenarios,
  DEFAULT_ESTIMATE_OPTIONS,
  defaultRevenueInput,
  inputsKey,
  snapshotInputs,
  type DiagnosisInputs,
} from "./compute";
import { manualFact } from "./facts";

const CHECKLIST: ChecklistAnswers = {
  leak: "no",
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

describe("진단 → 견적", () => {
  it("기본 정보·체크리스트·옵션을 견적 입력으로 옮긴다", () => {
    const c = computeEstimate(INPUTS, PRICE_V2026_10_1);
    expect(c.estimateInput).toMatchObject({
      floorArea: 72,
      bathrooms: 1,
      module: "B",
      optionalBaseWork: [],
      conditions: { bathroom: "full", kitchen: "full" },
    });
    // 욕실 250 + 주방 200 + 모듈 B 72㎡ 1,497.6 + IoT 100 = 2,047.6만 원
    expect(c.estimate.subtotal).toBeCloseTo(20_476_000, 0);
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
