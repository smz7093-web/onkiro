// AI 리모델링 가상 이미지: 외관 정면 사진 → 등급(하·중·상)별 리모델링 후 모습 (Vertex AI Gemini 이미지 편집, 10/15).
// 실제 시공 결과가 아닌 참고 그림이다. 화면에 'AI 가상 이미지'를 크게 표시한다.
// 이 파일은 네트워크를 쓰지 않는다(호출은 아래 vertexImageCaller, 테스트는 가짜 fetch).

export const RENDER_MODEL = "gemini-2.5-flash-image";
// 프롬프트를 바꾸면 올린다 (저장된 이미지를 다시 만든다). r2(10/19): 대상 4가지(외관·대표 방·욕실·주방)
// r3(10/31): 외관 중급형이 원본과 거의 같다는 PM 지적 — '주변 조경 유지'가 마당 정리와, '기와 스타일 유지'가 새 지붕과
// 부딪혀 모델이 거의 안 바꿨다. 형태(각도·면적·층수·지붕 윤곽)만 지키고 마감·색·창호·마당은 눈에 띄게 바꾸도록 고침
export const RENDER_PROMPT_VERSION = "r3";
// r4(10/31, 실내만): 욕실 그림에서 창문 위치가 바뀐다는 PM 지적 — 창·문을 '그대로 두라'는 지시를 구체화하고,
// 욕실·주방은 변기·세면대·싱크대 자리(배관)도 지키게 함. 외관은 PM이 r3 결과를 확인해 그대로 둔다(다시 그리지 않게)
// r5(10/31): r4의 'Keep the toilet, washbasin…'을 모델이 옛 설비를 그대로 두라는 뜻으로 읽어 욕실 개수대가 남음(PM 지적)
// → 옛 설비·개수대·물통·노출 배관은 모두 없애고 비슷한 자리에 새것을 설치하라고 바꿈
export const RENDER_INTERIOR_PROMPT_VERSION = "r5";
export const renderPromptVersion = (target: RenderTarget) =>
  target === "exterior"
    ? RENDER_PROMPT_VERSION
    : RENDER_INTERIOR_PROMPT_VERSION;

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
    A: "Basic renovation: remove every piece of junk, pots, debris and weeds; clean the walls and repaint them in a fresh light color; repair and clean the roof so it looks sound and uniform; replace broken windows and doors with simple new ones in white frames; a tidy yard covered with simple gravel.",
    B: "Standard renovation: remove every piece of junk, pots, debris and overgrown plants; refinish all exterior walls with smooth warm-white stucco; replace the whole roof covering with brand-new, clean, uniform roofing of the same shape; replace all windows and the front door with new modern ones in dark grey frames; add a small natural wooden deck with two steps at the entrance; a neat gravel yard with a few trimmed shrubs; simple wall lights beside the door.",
    C: "Premium renovation: remove every piece of junk, pots, debris and overgrown plants; refined walls in warm-white stucco with natural wood cladding accents; replace the whole roof covering with brand-new high-quality roofing of the same shape; large new glass doors and windows in slim dark frames; a generous wooden deck along the front; a landscaped garden with a lawn, a stone path and low plantings; warm exterior lighting.",
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
  기와: "Use brand-new traditional Korean clay roof tiles in a clean, uniform color, keeping the same roof shape.",
  슬레이트:
    "Replace the old slate roof with a new metal roof (no asbestos slate).",
  "금속(강판)": "Use a clean new metal roof of the same shape.",
};

// 물 쓰는 곳은 배관 자리를 지킨다 (r4)
const FIXED: Partial<Record<RenderTarget, string>> = {
  bathroom:
    "Completely remove every old fixture: the old washbasin or sink, any old concrete or tiled utility basin, water tanks, buckets, hoses and exposed pipes. Install brand-new fixtures (toilet, vanity, shower) at roughly the same spots as the old ones. No old fixture may remain in the image.",
  kitchen:
    "Completely remove the old sink, cabinets, appliances and clutter. Install a brand-new sink and cooking area at roughly the same spots as the old ones. No old fixture may remain in the image.",
};

// 실내는 구조를 바꾸지 않게 하고(벽·창·문 위치 그대로), 개인 물건을 지운다
const KEEP: Record<"exterior" | "interior", string> = {
  exterior:
    "Keep exactly the same camera angle, building footprint, number of floors and roof outline, and the same sky and neighboring buildings. Do not make the building bigger. Change the materials, colors, windows, doors and yard so the renovation is obvious at first glance: the result must look clearly different from the original photo.",
  interior:
    "Keep exactly the same camera angle, room size and shape, ceiling height, and the positions of walls, windows and doors. Every existing window and door must stay exactly where it is in the photo, with the same size, shape and number of panes; do not move, add, remove, enlarge, shrink or cover any window or door, and keep the window frame visible; do not remove walls, do not make the room bigger. Remove clutter and all personal items such as photos, documents and clothes.",
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
    FIXED[target] ?? "",
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
