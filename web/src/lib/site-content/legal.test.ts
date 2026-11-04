import { describe, expect, it } from "vitest";
import {
  companyLines,
  DEFAULT_COMPANY,
  DEFAULT_PRIVACY,
  DEFAULT_TERMS,
  fillPlaceholders,
  parseLegalText,
  readCompany,
  readLegalDoc,
  splitBold,
  validateCompany,
  validateLegalDoc,
} from "./legal";

describe("parseLegalText", () => {
  it("제목·문단·목록·표를 나눈다", () => {
    const b = parseLegalText(
      "# 제1조\n첫 줄\n둘째 줄\n\n- 가\n- 나\n1. 하나\n2. 둘\n| 구분 | 항목 |\n|---|---|\n| 회원 | 닉네임 |\n## 작은",
    );
    expect(b).toEqual([
      { type: "h2", text: "제1조" },
      { type: "p", text: "첫 줄 둘째 줄" },
      { type: "ul", items: ["가", "나"] },
      { type: "ol", items: ["하나", "둘"] },
      { type: "table", head: ["구분", "항목"], rows: [["회원", "닉네임"]] },
      { type: "h3", text: "작은" },
    ]);
  });

  it("기본 약관·처리방침에 표와 제목이 있다", () => {
    expect(
      parseLegalText(DEFAULT_TERMS.body).filter((b) => b.type === "h2"),
    ).toHaveLength(9);
    const p = parseLegalText(DEFAULT_PRIVACY.body);
    expect(p.filter((b) => b.type === "table")).toHaveLength(3);
    expect(
      p.some((b) => b.type === "h2" && b.text.includes("보호책임자")),
    ).toBe(true);
  });
});

describe("fillPlaceholders", () => {
  it("빈칸을 사업자 정보·시행일로 채우고, 빈 값은 (미정)", () => {
    const c = { ...DEFAULT_COMPANY, operator: "온기로 팀", email: "" };
    expect(
      fillPlaceholders(
        "{운영주체} {시행일} {이메일} {모름}",
        c,
        "2026년 11월 4일",
      ),
    ).toBe("온기로 팀 2026년 11월 4일 (미정) {모름}");
  });

  it("기본 본문에는 알 수 없는 빈칸이 없다", () => {
    expect(validateLegalDoc(DEFAULT_TERMS)).toEqual([]);
    expect(validateLegalDoc(DEFAULT_PRIVACY)).toEqual([]);
  });
});

describe("읽기·검사", () => {
  it("문서가 없거나 본문이 비면 기본 문구", () => {
    expect(readLegalDoc("terms", null)).toBe(DEFAULT_TERMS);
    expect(readLegalDoc("privacy", { body: "  " })).toBe(DEFAULT_PRIVACY);
    expect(readLegalDoc("terms", { body: "본문", effectiveDate: "" })).toEqual({
      body: "본문",
      effectiveDate: DEFAULT_TERMS.effectiveDate,
    });
  });

  it("저장된 사업자 정보는 빈 값도 그대로 쓴다", () => {
    expect(readCompany(null)).toBe(DEFAULT_COMPANY);
    const c = readCompany({ phone: "", bizNumber: "123-45-67890" });
    expect(c.phone).toBe("");
    expect(c.bizNumber).toBe("123-45-67890");
    expect(c.operator).toBe(DEFAULT_COMPANY.operator);
  });

  it("알 수 없는 빈칸·필수 칸을 막는다", () => {
    expect(
      validateLegalDoc({ effectiveDate: "오늘", body: "{회사}" })[0],
    ).toContain("{회사}");
    expect(
      validateCompany({ ...DEFAULT_COMPANY, privacyContact: " " }),
    ).toHaveLength(1);
  });

  it("바닥글은 빈 칸을 빼고, 굵게 표시를 나눈다", () => {
    const lines = companyLines({
      ...DEFAULT_COMPANY,
      bizNumber: "",
      address: "",
    });
    expect(lines.some((l) => l.startsWith("사업자등록번호"))).toBe(false);
    expect(lines[0]).toBe("상호 온기로 팀");
    expect(splitBold("가 **나** 다")).toEqual([
      { text: "가 ", bold: false },
      { text: "나", bold: true },
      { text: " 다", bold: false },
    ]);
  });
});
