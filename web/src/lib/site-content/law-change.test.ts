import { describe, expect, it } from "vitest";
import {
  DEFAULT_LAW_CHANGE,
  LAW_LIMITS,
  readLawChange,
  validateLawChange,
  type LawChange,
} from "./law-change";

const copy = (): LawChange => structuredClone(DEFAULT_LAW_CHANGE);

describe("시행 예정 법 개정 참고 (siteContent/lawChange, 10/31)", () => {
  it("문서가 없으면 기본 요약, 기본 요약은 검사를 통과한다", () => {
    expect(readLawChange(null)).toEqual(DEFAULT_LAW_CHANGE);
    expect(validateLawChange(DEFAULT_LAW_CHANGE)).toEqual([]);
  });

  it("저장값을 읽을 때 빈 항목은 빼고, enabled가 false일 때만 숨긴다", () => {
    const c = readLawChange({
      enabled: false,
      title: "",
      note: "메모",
      items: [{ title: "가", body: "나" }, { title: "", body: "" }, null],
    });
    expect(c.enabled).toBe(false);
    expect(c.title).toBe(DEFAULT_LAW_CHANGE.title);
    expect(c.items).toEqual([{ title: "가", body: "나" }]);
    expect(readLawChange({ items: [] }).enabled).toBe(true);
  });

  it("길이·개수 초과와 '가능' 판정 표현을 막는다", () => {
    const c = copy();
    c.items[0].body = "가".repeat(LAW_LIMITS.itemBody + 1);
    c.items[1].title = "";
    c.note = "빈집이면 영업 가능";
    const errs = validateLawChange(c);
    expect(errs.some((e) => e.includes("1번 항목: 내용"))).toBe(true);
    expect(errs.some((e) => e.includes("2번 항목"))).toBe(true);
    expect(errs.some((e) => e.includes("판정"))).toBe(true);
    const many = copy();
    many.items = Array.from({ length: LAW_LIMITS.items + 1 }, () => ({
      title: "t",
      body: "b",
    }));
    expect(validateLawChange(many)).toContain(
      `항목은 ${LAW_LIMITS.items}개까지입니다.`,
    );
  });
});
