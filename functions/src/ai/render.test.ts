import { describe, expect, it, vi } from "vitest";
import {
  parseImageResponse,
  renderPrompt,
  renderPromptVersion,
  vertexImageCaller,
} from "./render.js";

describe("AI 리모델링 가상 이미지", () => {
  it("등급마다 수준이 다르고, 구도·크기 유지와 사람·글자 금지를 늘 넣는다", () => {
    const a = renderPrompt("A", { roofStructure: null });
    const c = renderPrompt("C", { roofStructure: "기와" });
    expect(a).toContain("Basic renovation");
    expect(c).toContain("Premium renovation");
    expect(c).toContain("brand-new traditional Korean clay roof tiles");
    for (const p of [a, c]) {
      expect(p).toContain("same camera angle");
      expect(p).toContain("Do not make the building bigger");
      expect(p).toContain("No people");
    }
  });

  it("실내는 창·문을 옮기지 않고, 욕실·주방은 배관 자리를 지킨다. 외관 버전은 그대로 (r4, 10/31)", () => {
    const bath = renderPrompt("B", { roofStructure: null }, "bathroom");
    expect(bath).toContain("must stay exactly where it is");
    expect(bath).toContain("number of panes");
    expect(bath).toContain("toilet, washbasin");
    expect(renderPrompt("B", { roofStructure: null }, "kitchen")).toContain(
      "Keep the sink",
    );
    expect(renderPrompt("B", { roofStructure: null }, "room")).not.toContain(
      "toilet",
    );
    expect(renderPromptVersion("exterior")).toBe("r3");
    expect(renderPromptVersion("bathroom")).toBe("r4");
  });

  it("외관은 형태만 지키고 바뀐 모습이 눈에 띄게 한다 (r3, 10/31 중급형이 원본과 거의 같던 문제)", () => {
    const b = renderPrompt("B", { roofStructure: "기와" });
    expect(b).toContain("clearly different from the original photo");
    expect(b).toContain("warm-white stucco");
    // 마당 정리와 부딪히던 '주변 조경 유지', 새 지붕과 부딪히던 '기와 스타일 유지'를 뺐다
    expect(b).not.toContain("surrounding landscape");
    expect(b).not.toContain("Keep a traditional");
  });

  it("실내(대표 방·욕실·주방)는 구조를 바꾸지 않고 개인 물건을 지우게 한다 (10/19)", () => {
    for (const t of ["room", "bathroom", "kitchen"] as const) {
      const p = renderPrompt("B", { roofStructure: "기와" }, t);
      expect(p).toContain("positions of walls, windows and doors");
      expect(p).toContain("do not remove walls");
      expect(p).toContain("personal items");
      expect(p).toContain("no reflections of people");
      expect(p).not.toContain("clay tile");
    }
    expect(renderPrompt("A", { roofStructure: null }, "bathroom")).toContain(
      "bathroom",
    );
  });

  it("응답에서 첫 이미지를 꺼내고, 없으면 오류", () => {
    const img = parseImageResponse({
      candidates: [
        {
          content: {
            parts: [
              { text: "here" },
              { inlineData: { mimeType: "image/png", data: "QUJD" } },
            ],
          },
        },
      ],
    });
    expect(img.mimeType).toBe("image/png");
    expect(img.data.toString()).toBe("ABC");
    expect(() =>
      parseImageResponse({
        candidates: [{ content: { parts: [{ text: "no" }] } }],
      }),
    ).toThrow();
  });

  it("Vertex AI에 사진과 프롬프트를 보내고 이미지를 받는다", async () => {
    const f = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    { inlineData: { mimeType: "image/png", data: "QUJD" } },
                  ],
                },
              },
            ],
          }),
        ),
    );
    const out = await vertexImageCaller(
      "p1",
      async () => "tok",
      f as unknown as typeof fetch,
    )(Buffer.from("jpg"), "prompt");
    expect(out.data.toString()).toBe("ABC");
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/projects/p1/locations/global/");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer tok",
    );
  });
});
