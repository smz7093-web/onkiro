import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_PERMIT_KNOWLEDGE,
  guidePermits,
  KNOWLEDGE_TAGS,
  parseKnowledgeDoc,
  parsePermitGuide,
  parsePermitQuery,
  permitPrompt,
  queryTags,
  retrieve,
  type PermitQuery,
} from "./permits.js";

vi.mock("firebase-functions", () => ({ logger: { warn: vi.fn() } }));

const BASE: PermitQuery = {
  floorArea: 87.1,
  structure: "조적조(벽돌·블록)",
  approvalDate: "1979-11-16",
  zoning: "계획관리지역",
  landUse: "대",
  mainPurpose: "단독주택",
  roadSide: "세로(가)",
  roofStructure: "기와",
  noRegistry: false,
  operator: "owner",
  question: null,
};

const ids = (q: PermitQuery) =>
  retrieve(DEFAULT_PERMIT_KNOWLEDGE, q).map((x) => x.doc.id);

describe("인허가 자료 검색 (RAG)", () => {
  it("기본 자료는 id가 겹치지 않고 태그가 정해진 목록 안에 있다", () => {
    const all = DEFAULT_PERMIT_KNOWLEDGE.map((d) => d.id);
    expect(new Set(all).size).toBe(all.length);
    for (const d of DEFAULT_PERMIT_KNOWLEDGE) {
      expect(d.tags.length).toBeGreaterThan(0);
      for (const t of d.tags)
        expect(KNOWLEDGE_TAGS as readonly string[]).toContain(t);
      expect(d.body.length).toBeLessThanOrEqual(2000);
    }
  });

  it("주의 신호가 있으면 그 주제 자료가 앞에 온다", () => {
    const slate = ids({ ...BASE, roofStructure: "슬레이트" });
    expect(slate).toContain("K13");
    const blind = ids({ ...BASE, roadSide: "맹지" });
    expect(blind).toContain("K11");
    const noReg = ids({ ...BASE, noRegistry: true });
    expect(noReg).toContain("K12");
    const warehouse = ids({ ...BASE, mainPurpose: "창고시설" });
    expect(warehouse.slice(0, 3)).toContain("K09");
  });

  it("위탁 운영이면 숙박업·한옥체험업 자료를 찾는다", () => {
    const r = ids({ ...BASE, operator: "entrust" });
    expect(r).toContain("K06");
    expect(queryTags({ ...BASE, operator: "entrust" })).toContain("숙박업");
    expect(queryTags(BASE)).not.toContain("위탁");
  });

  it("묻는 말과 낱말이 겹치는 자료를 찾는다", () => {
    const r = ids({ ...BASE, question: "지하수 수질검사를 받아야 하나요?" });
    expect(r[0]).toBe("K14");
  });

  it("같은 입력이면 같은 결과, 최대 6개", () => {
    expect(ids(BASE)).toEqual(ids(BASE));
    expect(ids(BASE).length).toBeLessThanOrEqual(6);
  });
});

describe("입력 검사", () => {
  it("집 정보 형식", () => {
    expect(parsePermitQuery({ ...BASE, question: "  " })?.question).toBeNull();
    expect(parsePermitQuery({ ...BASE, floorArea: -1 })).toBeNull();
    expect(parsePermitQuery({ ...BASE, noRegistry: "no" })).toBeNull();
    expect(parsePermitQuery({ ...BASE, operator: "x" })).toBeNull();
    expect(parsePermitQuery({ ...BASE, operator: undefined })?.operator).toBe(
      "unknown",
    );
  });

  it("관리 화면 자료 형식", () => {
    expect(parseKnowledgeDoc("x", { title: "", body: "본문" })).toBeNull();
    expect(
      parseKnowledgeDoc("x", { title: "제목", body: "본문", tags: ["민박", 3] }),
    ).toMatchObject({ tags: ["민박"], reviewed: false, url: null });
  });
});

describe("AI 응답 검사", () => {
  const raw = {
    summary: "거주 요건을 먼저 확인하세요.",
    items: [
      {
        title: "거주 요건",
        level: "check",
        explanation: "자료 K02",
        nextAction: "시군청 확인",
        sourceIds: ["K02", "K99"],
      },
      // 근거가 찾은 자료에 없으면 버린다
      {
        title: "지어낸 항목",
        level: "caution",
        explanation: "",
        nextAction: "",
        sourceIds: ["K99"],
      },
    ],
    unanswered: ["보조금 금액"],
  };

  it("찾은 자료에 없는 근거 id를 지우고, 근거 없는 항목은 버린다", () => {
    const g = parsePermitGuide(raw, ["K01", "K02"]);
    expect(g.items).toHaveLength(1);
    expect(g.items[0].sourceIds).toEqual(["K02"]);
    expect(g.unanswered).toEqual(["보조금 금액"]);
  });

  it("근거 있는 항목이 하나도 없으면 실패", () => {
    expect(() => parsePermitGuide(raw, ["K01"])).toThrow();
  });

  it("프롬프트에 찾은 자료와 집 정보가 들어가고, 인용한 자료만 출처로 돌려준다", async () => {
    const docs = DEFAULT_PERMIT_KNOWLEDGE.filter((d) =>
      ["K01", "K02"].includes(d.id),
    );
    const prompt = permitPrompt(BASE, docs);
    expect(prompt).toContain('<자료 id="K02"');
    expect(prompt).toContain("87.1㎡");
    const call = vi.fn().mockResolvedValue(raw);
    const r = await guidePermits(BASE, docs, call);
    expect(call.mock.calls[0][0].tool.name).toBe("permit_guide");
    expect(r.sources.map((s) => s.id)).toEqual(["K02"]);
  });
});
