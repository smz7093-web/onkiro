import { describe, expect, it } from "vitest";
import {
  isOptionalPart,
  missingPhotoParts,
  PHOTO_PARTS,
  REQUIRED_PHOTO_PARTS,
} from "./photos";

describe("선택 부위 (대표 방·외부 조경, 10/19)", () => {
  it("선택 부위는 빠져도 '사진 없는 부위'로 세지 않는다", () => {
    expect(REQUIRED_PHOTO_PARTS).toHaveLength(8);
    expect(PHOTO_PARTS).toHaveLength(10);
    expect(isOptionalPart("room")).toBe(true);
    expect(isOptionalPart("yard")).toBe(true);
    expect(isOptionalPart("front")).toBe(false);
    const required = REQUIRED_PHOTO_PARTS.map((p) => p.id);
    expect(missingPhotoParts(required)).toBe(0);
    expect(missingPhotoParts(["room", "yard"])).toBe(8);
  });
});
