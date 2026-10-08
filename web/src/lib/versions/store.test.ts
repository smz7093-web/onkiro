import { describe, expect, it } from "vitest";
import { suggestNextVersion } from "./store";

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
