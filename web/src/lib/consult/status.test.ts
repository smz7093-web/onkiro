import { describe, expect, it } from "vitest";
import { canTransition, suggestAssignee, type StaffCandidate } from "./status";

// D13 기준의 각 줄마다 테스트를 하나 이상 둔다 (원일, task.md 9.7).
describe("상담 상태 전이", () => {
  it("같은 단계로는 옮기지 않는다", () => {
    expect(canTransition("received", "received")).toBe(false);
  });

  it("어느 단계에서든 보류로 갈 수 있다", () => {
    expect(canTransition("received", "onHold")).toBe(true);
    expect(canTransition("contracted", "onHold")).toBe(true);
  });

  it.todo("접수에서 제안으로 바로 건너뛸 수 있는가");
  it.todo("보류에서 어느 단계로 돌아갈 수 있는가");
  it.todo("계약 후에 다른 단계로 옮길 수 있는가");
});

describe("담당자 추천", () => {
  const staff: StaffCandidate[] = [
    { uid: "seokwon", name: "석원", handles: ["inspection"] },
    { uid: "wonil", name: "원일", handles: ["turnkey", "entrust"] },
  ];

  it("유형을 맡는 사람을 추천한다", () => {
    expect(suggestAssignee("inspection", staff)).toBe("seokwon");
    expect(suggestAssignee("entrust", staff)).toBe("wonil");
  });

  it("맡는 사람이 없으면 추천하지 않는다", () => {
    expect(suggestAssignee("turnkey", [])).toBeNull();
  });
});
