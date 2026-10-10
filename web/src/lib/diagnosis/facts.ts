// 빈집 기본 정보 (SIM-02, 03, 05, task.md 6.3). properties/{id}.facts.{key}에 저장한다.
// 값마다 출처·조회 시각을 남기고, 사용자가 고치면 원래 값을 함께 보관한다 (prd.md 8절).
// 이 파일은 React·Firebase를 import하지 않는다.

export type FactSource =
  "manual" | "buildingRegistry" | "vworld" | "demoFixture";

export const FACT_SOURCE_LABELS: Record<FactSource, string> = {
  manual: "직접 입력",
  buildingRegistry: "공공데이터포털 건축물대장",
  vworld: "브이월드 토지정보",
  // 시연용 저장 데이터는 실시간 조회와 구분해 표시한다 (prd.md 6.7)
  demoFixture: "시연용 저장 데이터",
};

export type FactValue = number | string | null;

export interface Fact {
  value: FactValue;
  source: FactSource;
  // 외부 조회 시각(ISO 문자열). 직접 입력이면 null
  fetchedAt: string | null;
  userEdited: boolean;
  // 사용자가 고치기 전 조회값. 고친 적이 없으면 null
  originalValue: FactValue;
}

export type FactKind = "area" | "count" | "won" | "date" | "text";

export interface FactDef {
  key: FactKey;
  label: string;
  kind: FactKind;
  group: "building" | "land" | "manual";
  // 견적에 꼭 필요한 값 (비어 있으면 다음 단계로 못 간다)
  required?: boolean;
  // 직접 입력 시 고를 수 있는 값 (비우면 자유 입력)
  options?: string[];
}

export const FACT_KEYS = [
  "floorArea",
  "landArea",
  "structure",
  "roofStructure",
  "approvalDate",
  "landCategory",
  "zoning",
  "officialLandPrice",
  "bathrooms",
  "kitchens",
] as const;
export type FactKey = (typeof FACT_KEYS)[number];

export const FACT_DEFS: FactDef[] = [
  {
    key: "floorArea",
    label: "연면적",
    kind: "area",
    group: "building",
    required: true,
  },
  { key: "landArea", label: "대지면적", kind: "area", group: "building" },
  {
    key: "structure",
    label: "주구조",
    kind: "text",
    group: "building",
    options: [
      "목구조",
      "조적조(벽돌·블록)",
      "철근콘크리트",
      "경량철골",
      "기타",
    ],
  },
  {
    key: "roofStructure",
    label: "지붕",
    kind: "text",
    group: "building",
    options: ["기와", "슬레이트", "금속(강판)", "슬래브", "기타"],
  },
  { key: "approvalDate", label: "사용승인일", kind: "date", group: "building" },
  { key: "landCategory", label: "지목", kind: "text", group: "land" },
  { key: "zoning", label: "용도지역", kind: "text", group: "land" },
  {
    key: "officialLandPrice",
    label: "개별공시지가(원/㎡)",
    kind: "won",
    group: "land",
  },
  {
    key: "bathrooms",
    label: "욕실 수",
    kind: "count",
    group: "manual",
    required: true,
  },
  {
    key: "kitchens",
    label: "주방 수",
    kind: "count",
    group: "manual",
    required: true,
  },
];

export type Facts = Partial<Record<FactKey, Fact>>;

export function manualFact(value: FactValue): Fact {
  return {
    value,
    source: "manual",
    fetchedAt: null,
    userEdited: false,
    originalValue: null,
  };
}

// 화면에서 값을 바꿨을 때. 조회값을 고치면 원래 값을 처음 한 번만 보관한다.
// 조회값과 같은 값으로 되돌리면 수정 표시를 지운다.
export function editFact(current: Fact | undefined, value: FactValue): Fact {
  if (!current || current.source === "manual") return manualFact(value);
  const original = current.userEdited ? current.originalValue : current.value;
  if (value === original) {
    return { ...current, value, userEdited: false, originalValue: null };
  }
  return { ...current, value, userEdited: true, originalValue: original };
}

// 입력 칸 문자열 → 저장 값. 숫자 칸은 쉼표를 지우고 숫자가 아니면 null(결측)
export function parseFactInput(kind: FactKind, raw: string): FactValue {
  const t = raw.trim();
  if (t === "") return null;
  if (kind === "area" || kind === "count" || kind === "won") {
    const n = Number(t.replaceAll(",", ""));
    if (!Number.isFinite(n) || n < 0) return null;
    return kind === "count" ? Math.round(n) : n;
  }
  return t;
}

// 비어 있는 필수 값 (다음 단계 진행 조건). 연면적은 0보다 커야 하고 욕실·주방은 0개도 허용한다
export function missingRequired(facts: Facts): FactKey[] {
  return FACT_DEFS.filter((d) => d.required)
    .filter((d) => {
      const v = facts[d.key]?.value;
      if (typeof v !== "number") return true;
      return d.kind === "area" ? v <= 0 : v < 0;
    })
    .map((d) => d.key);
}

// 처음 만든 진단의 기본값. 욕실·주방은 1개로 시작한다
export function initialFacts(): Facts {
  return { bathrooms: manualFact(1), kitchens: manualFact(1) };
}
