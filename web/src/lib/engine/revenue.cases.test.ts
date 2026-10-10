import { describe, expect, it } from "vitest";
import { ASSUMPTION_V0_3 } from "./defaults";
import { calculateScenarios } from "./revenue";
import type { RevenueInput } from "./types";

// 수익 검증 사례 (원일, task.md 5.7).
// D6 값으로 손으로(엑셀로) 계산한 결과를 아래 표에 한 줄씩 넣는다. 엔진 결과와 만 원 단위로 비교한다.
// 어긋나면 엔진과 손계산 중 어느 쪽이 맞는지 PM과 확인하고, 결과를 task.md 5.7 진행 메모에 남긴다.
// D6가 새 가정값 버전이 되면 ASSUMPTION_V0_3 자리에 그 값을 넣는다.

const man = (won: number) => Math.round(won / 10_000);

interface Case {
  name: string;
  // 총투자금(원): 견적 합계 + 기타 초기 투자
  investment: number;
  // 기본값에서 바꾼 입력만 적는다
  input: Partial<RevenueInput>;
  // 기대값(만 원): 월 매출, 월 운영비, 월 차감 후 추정액 — 보수·기본·낙관 순서
  expected: {
    conservative: { revenue: number; operatingCost: number; net: number };
    base: { revenue: number; operatingCost: number; net: number };
    optimistic: { revenue: number; operatingCost: number; net: number };
  };
}

const CASES: Case[] = [
  // 예시: prd.md 7.2 검증표와 같은 값 (revenue.test.ts와 같은 사례)
  {
    name: "검증표 · 총투자 3,300만 원, 기본값",
    investment: 33_000_000,
    input: {},
    expected: {
      conservative: { revenue: 309, operatingCost: 186, net: 122 },
      base: { revenue: 411, operatingCost: 217, net: 195 },
      optimistic: { revenue: 480, operatingCost: 237, net: 243 },
    },
  },
  // TODO(원일): D6 사례를 여기에 추가한다. 예) 객실가를 낮춘 경우, 임대료가 있는 경우, 1호점 실제 조건
];

describe("수익 검증 사례", () => {
  it.each(CASES)("$name", ({ investment, input, expected }) => {
    const s = calculateScenarios(
      { ...ASSUMPTION_V0_3.defaults, ...input },
      investment,
      ASSUMPTION_V0_3,
    );
    for (const id of ["conservative", "base", "optimistic"] as const) {
      expect({
        revenue: man(s[id].revenue),
        operatingCost: man(s[id].operatingCost),
        net: man(s[id].net),
      }).toEqual(expected[id]);
    }
  });
});
