import { describe, expect, it } from "vitest";
import { FORMULA_VERSION } from "./version";

describe("FORMULA_VERSION", () => {
  it("v1.1: 지붕 면적에 층수 반영 (10/14)", () => {
    expect(FORMULA_VERSION).toBe("v1.1");
  });
});
