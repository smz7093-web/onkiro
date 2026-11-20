import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { photoRetention } from "./retention";

// 사진 보관 규칙은 서버(functions/src/retention.ts)와 화면이 같은 코드를 쓴다 (task.md 11.2)
const code = (p: string) =>
  readFileSync(resolve(__dirname, p), "utf8")
    .split("\n")
    .filter((l) => !l.startsWith("//"))
    .join("\n");

describe("사진 보관 기간 (화면용 복사본)", () => {
  it("서버 규칙과 코드가 같다", () => {
    expect(code("./retention.ts")).toBe(
      code("../../../../functions/src/retention.ts"),
    );
  });

  it("마지막 이용 후 1년, 상담 신청 진단은 보관", () => {
    const r = photoRetention({
      lastUsedAt: new Date("2026-11-20T00:00:00Z"),
      updatedAt: null,
      createdAt: null,
      hasConsult: false,
    });
    expect(r?.kind === "expires" && r.at.toISOString()).toBe(
      "2027-11-20T00:00:00.000Z",
    );
    expect(
      photoRetention({
        lastUsedAt: null,
        updatedAt: null,
        createdAt: new Date(),
        hasConsult: true,
      }),
    ).toEqual({ kind: "consult" });
  });
});
