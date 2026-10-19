import { describe, expect, it } from "vitest";
import { FORMULA_VERSION } from "./version";

describe("FORMULA_VERSION", () => {
  it("v1.2: 공기 병행 묶음·석면 슬레이트 처리비 (10/19)", () => {
    expect(FORMULA_VERSION).toBe("v1.2");
  });
});
