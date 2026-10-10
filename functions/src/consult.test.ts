import { describe, expect, it } from "vitest";
import {
  canHandle,
  canManageAll,
  parseProxyInput,
  planUpdate,
} from "./consult.js";

const current = { status: "received", assigneeUid: null, memo: "" };

describe("상담 권한", () => {
  it("관리자·전체 권한은 모든 상담, 담당 건 권한은 배정된 상담만", () => {
    expect(canHandle({ role: "admin" }, "pm", null)).toBe(true);
    expect(
      canHandle({ role: "staff", consultAccess: "all" }, "wonil", null),
    ).toBe(true);
    expect(
      canHandle(
        { role: "staff", consultAccess: "assigned" },
        "seokwon",
        "seokwon",
      ),
    ).toBe(true);
    expect(
      canHandle(
        { role: "staff", consultAccess: "assigned" },
        "seokwon",
        "wonil",
      ),
    ).toBe(false);
    expect(
      canHandle({ role: "staff", consultAccess: "none" }, "haesoon", null),
    ).toBe(false);
    expect(canHandle({ role: "member" }, "alice", null)).toBe(false);
  });

  it("배정·대리 입력은 전체 권한만", () => {
    expect(canManageAll({ role: "staff", consultAccess: "all" })).toBe(true);
    expect(canManageAll({ role: "staff", consultAccess: "assigned" })).toBe(
      false,
    );
  });
});

describe("상담 변경 계획", () => {
  it("바뀐 항목만 이벤트로 남긴다", () => {
    const r = planUpdate(current, { status: "contacted", memo: "" });
    expect(r).toEqual({
      ok: true,
      changes: { status: "contacted" },
      events: [{ kind: "status", before: "received", after: "contacted" }],
    });
  });

  it("담당자 배정·해제", () => {
    const r = planUpdate(current, { assigneeUid: "wonil" });
    expect(r.ok && r.events[0]).toEqual({
      kind: "assignee",
      before: null,
      after: "wonil",
    });
    const off = planUpdate(
      { ...current, assigneeUid: "wonil" },
      { assigneeUid: null },
    );
    expect(off.ok && off.changes).toEqual({ assigneeUid: null });
  });

  it("잘못된 입력은 거부한다", () => {
    expect(planUpdate(current, { status: "done" }).ok).toBe(false);
    expect(planUpdate(current, { memo: "x".repeat(2001) }).ok).toBe(false);
    expect(planUpdate(current, { assigneeUid: "" }).ok).toBe(false);
  });
});

describe("전화 접수 대리 입력", () => {
  const ok = {
    type: "inspection",
    applicantName: " 홍길동 ",
    phone: "010-1234-5678",
    ownership: "self",
    preferredDate: "2026-10-20",
  };

  it("정상 입력은 다듬어 받는다", () => {
    const r = parseProxyInput(ok);
    expect(r.ok && r.value.applicantName).toBe("홍길동");
    expect(r.ok && r.value.memo).toBe("");
  });

  it("연락처·유형·날짜 형식을 검사한다", () => {
    expect(parseProxyInput({ ...ok, phone: "abc" }).ok).toBe(false);
    expect(parseProxyInput({ ...ok, type: "visit" }).ok).toBe(false);
    expect(parseProxyInput({ ...ok, preferredDate: "10/20" }).ok).toBe(false);
  });
});
