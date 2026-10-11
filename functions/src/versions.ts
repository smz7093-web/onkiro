// 단가 DB·가정값 버전 검증 (task.md 5.1·5.2, ADM-01·02).
// 적용(activate) 전에 서버에서 한 번 더 검사한다. 형태는 web/src/lib/engine/types.ts의 PriceTable·AssumptionSet과 같다.

export const VERSION_KINDS = ["price", "assumption"] as const;
export type VersionKind = (typeof VERSION_KINDS)[number];

export const COLLECTION_OF: Record<VersionKind, string> = {
  price: "priceVersions",
  assumption: "assumptionVersions",
};

// 적용 권한과 편집 권한 (prd.md 4절 권한표)
export const EDIT_PERM_OF: Record<VersionKind, string> = {
  price: "canEditPrices",
  assumption: "canEditAssumptions",
};

const PROCESS_IDS = [
  "demolition",
  "roof",
  "structure",
  "insulation",
  "electrical",
  "bathroom",
  "kitchen",
  "interior",
  "exterior",
  "iot",
];
const GRADES = ["good", "partial", "full"];
const RISK_FLAGS = ["majorCrack", "severeTilt", "roofCollapse"];
const QUANTITY_BASES = [
  "floorArea",
  "roofArea",
  "bathrooms",
  "kitchens",
  "lumpSum",
];
const REVENUE_FIELDS = [
  "weekdayPrice",
  "weekendPrice",
  "occupancy",
  "otaFeeRate",
  "unavailableDays",
  "otaShare",
  "avgStayNights",
  "cleaningCostPerTurn",
  "utilities",
  "rent",
  "insuranceMaintenance",
  "ancillaryRate",
  "otherInitialInvestment",
];
// 3안이 이 범위를 벗어나지 않아야 한다 (prd.md SIM-14)
const SCENARIO_MIN = 0.1;
const SCENARIO_MAX = 0.95;
const EPS = 1e-9;

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

class Checker {
  errors: string[] = [];
  num(label: string, v: unknown, min = 0, max = Infinity) {
    if (!isNum(v)) this.errors.push(`${label}: 숫자가 아닙니다`);
    else if (v < min || v > max)
      this.errors.push(
        `${label}: ${min}~${max === Infinity ? "" : max} 범위를 벗어났습니다 (${v})`,
      );
  }
  check(cond: boolean, message: string) {
    if (!cond) this.errors.push(message);
  }
}

export function validatePriceTable(data: unknown, version: string): string[] {
  const c = new Checker();
  if (!isObj(data)) return ["단가 데이터가 없습니다"];
  c.check(
    data.version === version,
    `version 필드가 문서 버전(${version})과 다릅니다`,
  );

  if (!isObj(data.processes)) c.check(false, "processes가 없습니다");
  else {
    for (const [id, p] of Object.entries(data.processes)) {
      c.check(PROCESS_IDS.includes(id), `모르는 공정입니다: ${id}`);
      if (!isObj(p)) {
        c.check(false, `${id}: 단가 정보가 없습니다`);
        continue;
      }
      c.check(
        QUANTITY_BASES.includes(p.quantityBasis as string),
        `${id}: 기준수량이 잘못됐습니다`,
      );
      for (const f of [
        "baseUnitPrice",
        "repairUnitPrice",
        "baseDays",
        "repairDays",
      ]) {
        if (p[f] !== undefined) c.num(`${id}.${f}`, p[f]);
      }
      if (p.baseApplies !== undefined)
        c.check(
          ["always", "optional"].includes(p.baseApplies as string),
          `${id}: baseApplies가 잘못됐습니다`,
        );
    }
  }

  const m = isObj(data.moduleUnitPrices) ? data.moduleUnitPrices : {};
  for (const k of ["A", "B", "C"]) c.num(`모듈 ${k} 단가`, m[k], 1);

  const cc = isObj(data.conditionCoefficients)
    ? data.conditionCoefficients
    : {};
  for (const k of ["good", "partial", "full"])
    c.num(`상태계수 ${k}`, cc[k], 0, 1);
  if (isNum(cc.good) && isNum(cc.partial) && isNum(cc.full))
    c.check(
      cc.good <= cc.partial && cc.partial <= cc.full,
      "상태계수는 양호 ≤ 부분 ≤ 전면이어야 합니다",
    );

  c.num("지붕면적 계수", data.roofAreaFactor, 0.5, 3);
  c.num("예비비율", data.contingencyRate, 0, 1);
  c.num("고정일", data.fixedDays, 0, 365);
  c.num("범위 반올림 단위", data.rangeRoundingUnit, 1);

  if (
    !isObj(data.regionFactors) ||
    Object.keys(data.regionFactors).length === 0
  )
    c.check(false, "지역계수가 하나 이상 있어야 합니다");
  else
    for (const [r, f] of Object.entries(data.regionFactors))
      c.num(`지역계수 ${r}`, f, 0.1, 5);

  const u = isObj(data.uncertainty) ? data.uncertainty : {};
  for (const k of [
    "base",
    "perMissingPhotoPart",
    "noRegistry",
    "perUnknownAnswer",
  ])
    c.num(`불확실도 ${k}`, u[k], 0, 1);

  // 체크리스트 판정표 (D4, task.md 3.7). 없으면 화면이 기본 판정표를 쓴다
  if (data.checklistRules !== undefined) {
    if (!Array.isArray(data.checklistRules))
      c.check(false, "판정표가 목록이 아닙니다");
    else
      data.checklistRules.forEach((r: unknown, i: number) => {
        const n = `판정표 ${i + 1}번째 줄`;
        if (!isObj(r)) return c.check(false, `${n}: 형식이 잘못됐습니다`);
        c.check(
          typeof r.question === "string" && typeof r.answer === "string",
          `${n}: 문항·답이 없습니다`,
        );
        c.check(
          r.process === null || PROCESS_IDS.includes(r.process as string),
          `${n}: 모르는 공정입니다`,
        );
        c.check(
          r.grade === null || GRADES.includes(r.grade as string),
          `${n}: 판정이 잘못됐습니다`,
        );
        c.check(
          r.risk === null || RISK_FLAGS.includes(r.risk as string),
          `${n}: 모르는 위험 신호입니다`,
        );
        c.check(
          (r.process === null) === (r.grade === null),
          `${n}: 공정과 판정은 함께 골라야 합니다`,
        );
        c.check(
          r.process !== null || r.risk !== null,
          `${n}: 공정이나 위험 신호 중 하나는 있어야 합니다`,
        );
      });
  }

  return c.errors;
}

export function validateAssumptionSet(
  data: unknown,
  version: string,
): string[] {
  const c = new Checker();
  if (!isObj(data)) return ["가정값 데이터가 없습니다"];
  c.check(
    data.version === version,
    `version 필드가 문서 버전(${version})과 다릅니다`,
  );
  c.check(
    typeof data.region === "string" && data.region.length > 0,
    "region이 없습니다",
  );

  const d = isObj(data.defaults) ? data.defaults : {};
  for (const f of REVENUE_FIELDS) {
    if (["occupancy", "otaFeeRate", "otaShare", "ancillaryRate"].includes(f))
      c.num(f, d[f], 0, 1);
    else if (f === "unavailableDays") c.num(f, d[f], 0, 30);
    else if (f === "avgStayNights") c.num(f, d[f], 1, 30);
    else c.num(f, d[f]);
  }

  const s = isObj(data.scenarioDeltas) ? data.scenarioDeltas : {};
  c.num("보수안 편차", s.conservative, -1, 0);
  c.num("낙관안 편차", s.optimistic, 0, 1);

  const r = isObj(data.occupancyRange) ? data.occupancyRange : {};
  c.num("가동률 하한", r.min, 0, 1);
  c.num("가동률 상한", r.max, 0, 1);
  if (
    isNum(r.min) &&
    isNum(r.max) &&
    isNum(s.conservative) &&
    isNum(s.optimistic)
  ) {
    c.check(r.min < r.max, "가동률 하한이 상한보다 작아야 합니다");
    c.check(
      r.min + s.conservative >= SCENARIO_MIN - EPS,
      `가동률 하한 + 보수안 편차가 ${SCENARIO_MIN * 100}% 이상이어야 합니다`,
    );
    c.check(
      r.max + s.optimistic <= SCENARIO_MAX + EPS,
      `가동률 상한 + 낙관안 편차가 ${SCENARIO_MAX * 100}% 이하여야 합니다`,
    );
    if (isNum(d.occupancy))
      c.check(
        d.occupancy >= r.min - EPS && d.occupancy <= r.max + EPS,
        "기본 가동률이 입력 범위 밖입니다",
      );
  }

  if (data.seasonalOccupancy !== undefined) {
    const so = isObj(data.seasonalOccupancy) ? data.seasonalOccupancy : {};
    c.num("성수기 가동률", so.peak, 0, 1);
    c.num("비수기 가동률", so.offPeak, 0, 1);
  }
  return c.errors;
}

export function validateVersion(
  kind: VersionKind,
  data: unknown,
  version: string,
) {
  return kind === "price"
    ? validatePriceTable(data, version)
    : validateAssumptionSet(data, version);
}

// 적용 권한: 관리자이거나 canApproveVersions가 있는 운영팀
export function canApprove(token: Record<string, unknown> | undefined) {
  if (!token) return false;
  if (token.role === "admin") return true;
  return (
    token.role === "staff" &&
    Array.isArray(token.perms) &&
    token.perms.includes("canApproveVersions")
  );
}
