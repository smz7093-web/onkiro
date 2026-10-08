import { describe, expect, it } from "vitest";
import { FORMULA_VERSION } from "./version";

describe("FORMULA_VERSION", () => {
  it("prd.md 7.3의 계산식 버전과 같다", () => {
    expect(FORMULA_VERSION).toBe("v1.0");
  });
});
