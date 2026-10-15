import { describe, expect, it } from "vitest";
import {
  DEFAULT_PERMIT_CONTENT,
  permitItems,
  type PermitContent,
} from "../diagnosis/permits";
import { photoGuide } from "../diagnosis/photos";
import {
  readPermitContent,
  readPhotoGuides,
  validatePermitContent,
  validatePhotoGuides,
} from "./content";

const copy = (): PermitContent => structuredClone(DEFAULT_PERMIT_CONTENT);

describe("관리 화면 인허가 문구 (D7, siteContent/permits)", () => {
  it("문서가 없으면 기본 문구, 빈 칸은 기본 문구로 채운다", () => {
    expect(readPermitContent(null)).toEqual(DEFAULT_PERMIT_CONTENT);
    const c = readPermitContent({
      general: [
        {
          id: "a",
          title: "민박 신고",
          nextAction: "군청 문의",
          agency: "홍성군청 건축과",
        },
      ],
      conditional: { roadBlind: { title: "", nextAction: "진입로 확인" } },
    });
    expect(c.general).toEqual([
      {
        id: "a",
        title: "민박 신고",
        nextAction: "군청 문의",
        agency: "홍성군청 건축과",
      },
    ]);
    expect(c.conditional.roadBlind.title).toBe(
      DEFAULT_PERMIT_CONTENT.conditional.roadBlind.title,
    );
    expect(c.conditional.roadBlind.nextAction).toBe("진입로 확인");
    expect(c.conditional.noRegistry).toEqual(
      DEFAULT_PERMIT_CONTENT.conditional.noRegistry,
    );
  });

  it("고친 문구가 화면 항목에 쓰이고, {용도}·{도로}는 실제 값으로 바뀐다", () => {
    const c = copy();
    c.general = [
      { id: "g1", title: "민박 신고", nextAction: "문의", agency: "홍성군청" },
    ];
    c.conditional.mainPurpose.title = "용도 '{용도}' 확인";
    c.conditional.roadNarrow.title = "좁은 길 {도로}";
    const items = permitItems(
      true,
      { mainPurpose: "창고시설", roadSide: "세로(불)" },
      c,
    );
    expect(items.map((i) => i.title)).toEqual([
      DEFAULT_PERMIT_CONTENT.conditional.noRegistry.title,
      "용도 '창고시설' 확인",
      "좁은 길 세로(불)",
      "민박 신고",
    ]);
    expect(items[3].agency).toBe("홍성군청");
  });

  it("저장 전 검사: 빈 칸, '가능' 판정 표현, 빠진 {용도}를 막는다", () => {
    expect(validatePermitContent(copy())).toEqual([]);
    const c = copy();
    c.general[0].title = "";
    c.general[1].nextAction = "영업 가능합니다";
    c.conditional.mainPurpose.title = "주택 아님";
    const errors = validatePermitContent(c);
    expect(errors.some((e) => e.includes("제목을 입력"))).toBe(true);
    expect(errors.some((e) => e.includes("'가능'"))).toBe(true);
    expect(errors.some((e) => e.includes("{용도}"))).toBe(true);
  });
});

describe("관리 화면 촬영 가이드 (D9, siteContent/photoGuides)", () => {
  it("고친 부위만 바꾸고 나머지는 기본 문구", () => {
    const g = readPhotoGuides({
      guides: { front: " 지붕 끝까지 ", roof: "", foo: "x" },
    });
    expect(g).toEqual({ front: "지붕 끝까지" });
    expect(photoGuide("front", g)).toBe("지붕 끝까지");
    expect(photoGuide("roof", g)).toContain("지붕");
    expect(readPhotoGuides(null)).toEqual({});
  });

  it("너무 긴 문구는 막는다", () => {
    expect(validatePhotoGuides({ front: "가".repeat(201) })).toHaveLength(1);
    expect(validatePhotoGuides({ front: "짧은 문구" })).toEqual([]);
  });
});
