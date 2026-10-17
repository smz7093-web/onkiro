import { describe, expect, it } from "vitest";
import { objectParticle } from "./korean";

describe("목적격 조사", () => {
  it("받침 있으면 을, 없으면 를, 한글이 아니면 을(를)", () => {
    expect(objectParticle("연면적")).toBe("을");
    expect(objectParticle("욕실 수")).toBe("를");
    expect(objectParticle("건축물대장, 토지 정보")).toBe("를");
    expect(objectParticle("TourAPI")).toBe("을(를)");
  });
});
