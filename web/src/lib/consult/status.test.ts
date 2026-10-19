import { describe, expect, it } from "vitest";
import {
  canTransition,
  isBackward,
  suggestAssignee,
  type StaffCandidate,
} from "./status";

// D13 기준의 각 줄마다 테스트를 하나 이상 둔다 (원일, task.md 9.7).
describe("상담 상태 전이", () => {
  it("같은 단계로는 옮기지 않는다", () => {
    expect(canTransition("received", "received")).toBe(false);
  });

  it("어느 단계에서든 보류로 갈 수 있다", () => {
    expect(canTransition("received", "onHold")).toBe(true);
    expect(canTransition("contracted", "onHold")).toBe(true);
  });

  it("앞으로는 순서대로, 방문 예정만 건너뛸 수 있다", () => {
    expect(canTransition("received", "contacted")).toBe(true);
    expect(canTransition("received", "proposed")).toBe(false);
    expect(canTransition("contacted", "proposed")).toBe(true);
    expect(canTransition("contacted", "contracted")).toBe(false);
    expect(canTransition("proposed", "contracted")).toBe(true);
  });

  it("한 단계만 되돌린다 (메모 필요)", () => {
    expect(canTransition("contacted", "received")).toBe(true);
    expect(isBackward("contacted", "received")).toBe(true);
    expect(canTransition("proposed", "contacted")).toBe(true);
    expect(canTransition("proposed", "received")).toBe(false);
    expect(isBackward("contacted", "proposed")).toBe(false);
  });

  it("보류에서는 보류 직전 단계로만 돌아간다", () => {
    expect(canTransition("onHold", "proposed", "proposed")).toBe(true);
    expect(canTransition("onHold", "contacted", "proposed")).toBe(false);
    expect(canTransition("onHold", "contacted")).toBe(true);
  });

  it("계약 후에는 보류 말고는 옮기지 않는다", () => {
    expect(canTransition("contracted", "proposed")).toBe(false);
    expect(canTransition("contracted", "onHold")).toBe(true);
  });
});

describe("담당자 추천", () => {
  const staff: StaffCandidate[] = [
    { uid: "seokwon", name: "석원", handles: ["inspection"] },
    { uid: "wonil", name: "원일", handles: ["turnkey", "entrust"] },
  ];

  it("유형별 기본 담당 이름을 먼저 추천한다 (현장진단 석원, 턴키 PM, 빈집 맡기기 원일)", () => {
    const team: StaffCandidate[] = [
      { uid: "u1", name: "원일", handles: [] },
      { uid: "u2", name: "김석원", handles: [] },
      { uid: "u3", name: "장상민(PM)", handles: [] },
    ];
    expect(suggestAssignee("inspection", team)).toBe("u2");
    expect(suggestAssignee("turnkey", team)).toBe("u3");
    expect(suggestAssignee("entrust", team)).toBe("u1");
  });

  it("유형을 맡는 사람을 추천한다", () => {
    expect(suggestAssignee("inspection", staff)).toBe("seokwon");
    expect(suggestAssignee("entrust", staff)).toBe("wonil");
  });

  it("맡는 사람이 없으면 추천하지 않는다", () => {
    expect(suggestAssignee("turnkey", [])).toBeNull();
  });
});
