import { describe, expect, it } from "vitest";
import { suggestNextVersion, withoutUndefined } from "./store";

describe("suggestNextVersion", () => {
  const today = new Date(2026, 9, 9);
  it("단가는 같은 달의 다음 번호", () => {
    expect(suggestNextVersion("price", [], today)).toBe("v2026.10-1");
    expect(
      suggestNextVersion(
        "price",
        ["v2026.10-1", "v2026.10-3", "v2026.09-7"],
        today,
      ),
    ).toBe("v2026.10-4");
  });
  it("가정값은 다음 소수 버전", () => {
    expect(suggestNextVersion("assumption", [], today)).toBe("v0.1");
    expect(
      suggestNextVersion("assumption", ["v0.3", "v0.10", "v1.0"], today),
    ).toBe("v0.11");
  });
});

describe("withoutUndefined (10/19 저장 오류)", () => {
  it("비운 칸(undefined)을 빼고 0·null·빈 문자열은 남긴다", () => {
    const data = {
      processes: {
        insulation: {
          quantityBasis: "floorArea",
          baseUnitPrice: undefined,
          repairUnitPrice: 120_000,
          repairDays: 0,
        },
      },
      note: "",
      basedOn: null,
      rules: [{ a: 1, b: undefined }, undefined],
    };
    expect(withoutUndefined(data)).toEqual({
      processes: {
        insulation: {
          quantityBasis: "floorArea",
          repairUnitPrice: 120_000,
          repairDays: 0,
        },
      },
      note: "",
      basedOn: null,
      rules: [{ a: 1 }],
    });
  });
});
