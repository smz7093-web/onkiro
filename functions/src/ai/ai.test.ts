import { describe, expect, it, vi } from "vitest";
import { AI_MODELS, claudeCaller, hasKey } from "./claude.js";
import {
  explainGrades,
  GRADE_SYSTEM,
  gradePrompt,
  parseGradeExplanation,
  parseGradeInput,
} from "./grades.js";
import { analyzePhotos, parsePhotoSuggestions } from "./photos.js";

vi.mock("firebase-functions", () => ({ logger: { warn: vi.fn() } }));

const INPUT = {
  house: {
    address: "충청남도 홍성군 홍성읍 충절로1053번길 86-9",
    floorArea: 87.1,
    structure: "조적조(벽돌·블록)",
    roofStructure: "기와",
    approvalDate: "1979-11-16",
    zoning: "제2종일반주거지역",
  },
  checklist: [{ question: "비가 새는 곳이 있나요?", answer: "예" }],
  tiers: [
    {
      module: "A",
      grade: "하",
      name: "기본형",
      unitPrice: 165000,
      total: 30_000_000,
      rangeLow: 25_000_000,
      rangeHigh: 35_000_000,
    },
    {
      module: "B",
      grade: "중",
      name: "표준형",
      unitPrice: 208000,
      total: 34_000_000,
      rangeLow: 28_000_000,
      rangeHigh: 40_000_000,
    },
    {
      module: "C",
      grade: "상",
      name: "고급형",
      unitPrice: 236000,
      total: 37_000_000,
      rangeLow: 31_000_000,
      rangeHigh: 43_000_000,
    },
  ],
  purpose: "농촌 독채 숙소",
};

const GOOD = {
  recommended: "B",
  reason: "1979년 조적조라 단열 보강과 함께 표준형이 적당합니다.",
  tiers: [
    {
      module: "A",
      materials: ["장판", "실크 벽지"],
      fit: "비용은 적지만 숙소 경쟁력이 낮습니다.",
    },
    {
      module: "B",
      materials: ["강마루", "친환경 도장"],
      fit: "가성비가 좋습니다.",
    },
    {
      module: "C",
      materials: ["원목마루", "포세린 타일"],
      fit: "객실가를 높일 때.",
    },
  ],
  cautions: ["누수 부위 먼저 확인"],
};

describe("AI 등급 설명", () => {
  it("화면 입력을 검사한다 (등급 3개, 숫자)", () => {
    expect(parseGradeInput(INPUT)).not.toBeNull();
    expect(
      parseGradeInput({ ...INPUT, tiers: INPUT.tiers.slice(0, 2) }),
    ).toBeNull();
    expect(
      parseGradeInput({
        ...INPUT,
        tiers: [
          { ...INPUT.tiers[0], total: -1 },
          INPUT.tiers[1],
          INPUT.tiers[2],
        ],
      }),
    ).toBeNull();
  });

  it("프롬프트에 단가표 금액을 넣고 변경 금지를 밝힌다", () => {
    const p = gradePrompt(parseGradeInput(INPUT)!);
    expect(p).toContain("변경 금지");
    expect(p).toContain("3,000만 원");
    expect(p).toContain("1979-11-16");
    // 주소는 AI에 보내지 않는다 (D8 국외 이전 항목 최소화)
    expect(p).not.toContain("충절로");
  });

  it("AI 응답을 검사하고 A·B·C 순서로 정리한다", async () => {
    const call = vi.fn(async () => ({
      ...GOOD,
      tiers: [...GOOD.tiers].reverse(),
    }));
    const r = await explainGrades(parseGradeInput(INPUT)!, call);
    expect(r.recommended).toBe("B");
    expect(r.tiers.map((t) => t.module)).toEqual(["A", "B", "C"]);
    expect(call).toHaveBeenCalledOnce();
  });

  it("추천 등급이 틀리면 거부한다", () => {
    expect(() =>
      parseGradeExplanation({ ...GOOD, recommended: "D" }),
    ).toThrow();
  });
});

describe("AI 사진 분석", () => {
  it("모르는 문항·선택지는 버리고 문항당 하나만 남긴다", () => {
    const r = parsePhotoSuggestions({
      suggestions: [
        {
          questionId: "crack",
          answer: "hairline",
          confidence: "medium",
          reason: "좌측 벽 가는 금",
          parts: ["left", "x"],
        },
        {
          questionId: "crack",
          answer: "wide",
          confidence: "high",
          reason: "중복",
          parts: [],
        },
        {
          questionId: "water",
          answer: "yes",
          confidence: "high",
          reason: "사진으로 판단 불가 문항",
          parts: [],
        },
        {
          questionId: "leak",
          answer: "maybe",
          confidence: "high",
          reason: "없는 선택지",
          parts: [],
        },
      ],
    });
    expect(r).toEqual([
      {
        questionId: "crack",
        answer: "hairline",
        confidence: "medium",
        reason: "좌측 벽 가는 금",
        parts: ["left"],
      },
    ]);
  });

  it("사진을 순서대로 이미지로 보내고 부위를 알려준다", async () => {
    const call = vi.fn(async () => ({ suggestions: [] }));
    await analyzePhotos(
      [
        { part: "roof", base64: "AAA" },
        { part: "crack", base64: "BBB" },
      ],
      call,
    );
    const req = call.mock.calls[0][0] as {
      content: { type: string; text?: string }[];
    };
    expect(req.content.map((c) => c.type)).toEqual(["image", "image", "text"]);
    expect(req.content[2].text).toContain("1번 지붕, 2번 벽체 균열 부위");
  });

  it("사진이 없으면 AI를 부르지 않는다", async () => {
    const call = vi.fn();
    expect(await analyzePhotos([], call)).toEqual([]);
    expect(call).not.toHaveBeenCalled();
  });
});

describe("Claude 호출", () => {
  it("임시값(pending) 키면 부르지 않는다", async () => {
    expect(hasKey("pending")).toBe(false);
    const f = vi.fn();
    await expect(
      claudeCaller(
        "pending",
        AI_MODELS.grades,
        f as unknown as typeof fetch,
      )({
        system: "",
        content: [],
        tool: { name: "t", description: "", input_schema: {} },
      }),
    ).rejects.toThrow();
    expect(f).not.toHaveBeenCalled();
  });

  it("도구 입력만 꺼내고, 도구 선택을 강제한다", async () => {
    const f = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            content: [{ type: "tool_use", name: "t", input: { ok: 1 } }],
          }),
        ),
    );
    const out = await claudeCaller(
      "sk-test",
      AI_MODELS.grades,
      f as unknown as typeof fetch,
    )({
      system: "s",
      content: [{ type: "text", text: "x" }],
      tool: { name: "t", description: "", input_schema: {} },
    });
    expect(out).toEqual({ ok: 1 });
    const body = JSON.parse(
      (f.mock.calls[0] as unknown as [string, RequestInit])[1].body as string,
    );
    expect(body.tool_choice).toEqual({ type: "auto" });
    expect(body.system).toContain("t 도구 한 번 호출로만");
    expect(body.model).toBe("claude-sonnet-5-5");
  });

  it("등급 설명은 Sonnet, 사진 분석은 Opus", () => {
    expect(AI_MODELS).toEqual({
      grades: "claude-sonnet-5-5",
      photos: "claude-opus-5-5",
    });
  });
});

describe("AI 등급 설명 · 확정 대표 마감 (10/19)", () => {
  it("화면이 보낸 콘셉트·대표 마감·범위를 받아 프롬프트에 넣고, 어긋나지 말라고 지시한다", () => {
    const tiers = (["A", "B", "C"] as const).map((m, i) => ({
      module: m,
      grade: (["하", "중", "상"] as const)[i],
      name: ["기본형", "표준형", "고급형"][i],
      unitPrice: 200_000,
      total: 30_000_000,
      rangeLow: 25_000_000,
      rangeHigh: 35_000_000,
      concept: "콘셉트" + m,
      finishes: ["장판·실크벽지", "강마루·포인트 도장", "원목마루·노출 서까래"][
        i
      ],
    }));
    const input = parseGradeInput({
      house: { floorArea: 72 },
      checklist: [],
      tiers,
      scope: "바닥·벽·천장 마감, 도배·도장, 실내 문, 조명",
    })!;
    expect(input.tiers[1].finishes).toBe("강마루·포인트 도장");
    const p = gradePrompt(input);
    expect(p).toContain(
      "대표 마감(확정, 이것과 어긋나지 않게): 강마루·포인트 도장",
    );
    expect(p).toContain("실내 마감 범위: 바닥·벽·천장 마감");
    expect(GRADE_SYSTEM).toContain("대표 마감과 같은 종류·수준으로만");
    expect(GRADE_SYSTEM).toContain("욕실·주방은 등급과 별개");
  });
});
