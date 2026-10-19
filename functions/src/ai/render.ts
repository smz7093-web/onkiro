// AI 리모델링 가상 이미지: 외관 정면 사진 → 등급(하·중·상)별 리모델링 후 모습 (Vertex AI Gemini 이미지 편집, 10/15).
// 실제 시공 결과가 아닌 참고 그림이다. 화면에 'AI 가상 이미지'를 크게 표시한다.
// 이 파일은 네트워크를 쓰지 않는다(호출은 아래 vertexImageCaller, 테스트는 가짜 fetch).

export const RENDER_MODEL = "gemini-2.5-flash-image";
// 프롬프트를 바꾸면 올린다 (저장된 이미지를 다시 만든다). r2(10/19): 대상 4가지(외관·대표 방·욕실·주방)
export const RENDER_PROMPT_VERSION = "r2";

export type Module = "A" | "B" | "C";

// 그릴 대상과 쓰는 사진 부위 (10/19)
export const RENDER_TARGETS = {
  exterior: { part: "front", label: "전체 외관" },
  room: { part: "room", label: "대표 방" },
  bathroom: { part: "bathroom", label: "욕실" },
  kitchen: { part: "kitchen", label: "주방" },
} as const;
export type RenderTarget = keyof typeof RENDER_TARGETS;
export const isRenderTarget = (v: unknown): v is RenderTarget =>
  typeof v === "string" && v in RENDER_TARGETS;

// 등급 수준 (web lib/diagnosis/compute.ts FINISH_TIERS의 하·중·상 대표 마감과 맞춘다)
const LEVEL: Record<RenderTarget, Record<Module, string>> = {
  exterior: {
    A: "Basic renovation: remove all junk and debris, repair and repaint the existing walls in a clean light color, repair the existing roof so it looks sound, fix broken doors, tidy the yard with simple gravel.",
    B: "Standard renovation: remove all junk and debris, clean repainted walls, a brand-new roof in good condition, new insulated windows and doors with dark frames, a small wooden deck by the entrance, tidy gravel yard with a few plants.",
    C: "Premium renovation: remove all junk and debris, refined exterior finish with natural wood cladding accents, a brand-new high-quality roof, large new glass doors and windows, a generous wooden deck, a landscaped garden with lawn and stone path, warm exterior lighting.",
  },
  room: {
    A: "Basic renovation of this guest room: clean vinyl floor, plain light wallpaper, a simple ceiling light, simple tidy bedding.",
    B: "Standard renovation of this guest room: light oak laminate floor, light walls with one accent painted wall, some indirect lighting, neat guest bedding and a small table.",
    C: "Premium renovation of this guest room: natural wood floor, smooth painted walls, exposed wooden rafters kept if they exist, warm indirect lighting, cozy boutique guesthouse styling.",
  },
  bathroom: {
    A: "Basic renovation of this bathroom: clean new standard tiles, a new standard toilet and washbasin, a simple mirror, bright ceiling light.",
    B: "Standard renovation of this bathroom: modern light-colored tiles, a wall-hung vanity, a glass shower partition, good lighting.",
    C: "Premium renovation of this bathroom: large-format stone-look tiles with wood accents, a rain shower with glass partition, a stylish vanity with soft lighting.",
  },
  kitchen: {
    A: "Basic renovation of this kitchen: a new basic sink cabinet and countertop, clean wall tiles, simple lighting.",
    B: "Standard renovation of this kitchen: modern cabinets in white or light wood, a solid countertop, under-cabinet lighting, a small dining table.",
    C: "Premium renovation of this kitchen: custom wood cabinetry, a stone-look countertop, open shelving, pendant lights over a dining table, boutique guesthouse style.",
  },
};

const ROOF: Record<string, string> = {
  기와: "Keep a traditional Korean clay tile roof style.",
  슬레이트:
    "Replace the old slate roof with a new metal roof (no asbestos slate).",
  "금속(강판)": "Use a clean new metal roof of the same shape.",
};

// 실내는 구조를 바꾸지 않게 하고(벽·창·문 위치 그대로), 개인 물건을 지운다
const KEEP: Record<"exterior" | "interior", string> = {
  exterior:
    "Keep exactly the same camera angle, building footprint, number of floors, roof shape and surrounding landscape. Do not make the building bigger.",
  interior:
    "Keep exactly the same camera angle, room size and shape, ceiling height, and the positions of walls, windows and doors. Do not add or enlarge windows, do not remove walls, do not make the room bigger. Remove clutter and all personal items such as photos, documents and clothes.",
};

export function renderPrompt(
  module: Module,
  house: { roofStructure: string | null },
  target: RenderTarget = "exterior",
): string {
  const exterior = target === "exterior";
  return [
    exterior
      ? "Edit this photo of an old, vacant rural Korean house to show how it could look after renovation into a cozy small guesthouse."
      : `Edit this photo of a ${target === "room" ? "guest room" : target} in an old, vacant rural Korean house to show how it could look after renovation for a cozy small guesthouse.`,
    KEEP[exterior ? "exterior" : "interior"],
    LEVEL[target][module],
    exterior && house.roofStructure ? (ROOF[house.roofStructure] ?? "") : "",
    "Photorealistic, natural daylight. No people, no reflections of people in mirrors, no cars, no text, no logos, no signs.",
  ]
    .filter(Boolean)
    .join(" ");
}

export interface GeneratedImage {
  mimeType: string;
  data: Buffer;
}

// Vertex AI generateContent 응답에서 첫 이미지를 꺼낸다
export function parseImageResponse(json: unknown): GeneratedImage {
  const parts = (
    json as {
      candidates?: {
        content?: {
          parts?: { inlineData?: { mimeType?: string; data?: string } }[];
        };
      }[];
    }
  )?.candidates?.[0]?.content?.parts;
  const img = parts?.find((p) => p.inlineData?.data)?.inlineData;
  if (!img?.data) throw new Error("이미지가 생성되지 않았습니다");
  const mimeType = img.mimeType ?? "image/png";
  if (!/^image\/(png|jpeg|webp)$/.test(mimeType))
    throw new Error("지원하지 않는 이미지 형식");
  return { mimeType, data: Buffer.from(img.data, "base64") };
}

export type RenderImage = (
  photo: Buffer,
  prompt: string,
) => Promise<GeneratedImage>;

// Cloud Functions 안에서는 메타데이터 서버에서 서비스 계정 토큰을 받는다 (키 없음)
export async function metadataToken(fetchImpl: typeof fetch = fetch) {
  const res = await fetchImpl(
    "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
    { headers: { "Metadata-Flavor": "Google" } },
  );
  if (!res.ok) throw new Error(`토큰 오류 ${res.status}`);
  return ((await res.json()) as { access_token: string }).access_token;
}

export function vertexImageCaller(
  projectId: string,
  getToken: () => Promise<string>,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = 90_000,
): RenderImage {
  return async (photo, prompt) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetchImpl(
        `https://aiplatform.googleapis.com/v1/projects/${projectId}/locations/global/publishers/google/models/${RENDER_MODEL}:generateContent`,
        {
          method: "POST",
          signal: ctrl.signal,
          headers: {
            Authorization: `Bearer ${await getToken()}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    inlineData: {
                      mimeType: "image/jpeg",
                      data: photo.toString("base64"),
                    },
                  },
                  { text: prompt },
                ],
              },
            ],
            generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
          }),
        },
      );
      if (!res.ok)
        throw new Error(
          `이미지 생성 오류 ${res.status}: ${(await res.text()).slice(0, 200)}`,
        );
      return parseImageResponse(await res.json());
    } finally {
      clearTimeout(timer);
    }
  };
}
