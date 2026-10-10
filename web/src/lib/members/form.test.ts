import { describe, expect, it } from "vitest";
import {
  effectiveForm,
  formFromDoc,
  PRESETS,
  sameForm,
  toCallableInput,
} from "./form";

describe("formFromDoc", () => {
  it("필드가 없으면 권한 없는 일반 회원이다", () => {
    const f = formFromDoc({ name: "홍길동" });
    expect(f.role).toBe("member");
    expect(f.photoAccess).toBe("none");
    expect(Object.values(f.flags).every((v) => v === false)).toBe(true);
  });

  it("잘못된 값은 가장 좁은 권한으로 읽는다", () => {
    const f = formFromDoc({
      role: "staff",
      photoAccess: "everything",
      canEditPrices: "yes",
      canEditContent: true,
    });
    expect(f.photoAccess).toBe("none");
    expect(f.flags.canEditPrices).toBe(false);
    expect(f.flags.canEditContent).toBe(true);
  });
});

describe("effectiveForm", () => {
  it("관리자는 필드와 관계없이 전체 권한이다", () => {
    const f = effectiveForm(formFromDoc({ role: "admin" }));
    expect(f.photoAccess).toBe("all");
    expect(f.flags.canApproveVersions).toBe(true);
  });
});

describe("toCallableInput", () => {
  it("일반 회원으로 내리면 운영팀 권한을 모두 지운다", () => {
    const seokwon = PRESETS.find((p) => p.id === "seokwon")!.form;
    const input = toCallableInput("u1", { ...seokwon, role: "member" });
    expect(input).toMatchObject({
      uid: "u1",
      role: "member",
      photoAccess: "none",
      consultAccess: "none",
      canEditPrices: false,
      canReviewCosts: false,
    });
  });

  it("운영팀 권한은 그대로 보낸다", () => {
    const wonil = PRESETS.find((p) => p.id === "wonil")!.form;
    expect(toCallableInput("u2", wonil)).toMatchObject({
      role: "staff",
      photoAccess: "assigned",
      consultAccess: "all",
      canEditAssumptions: true,
      canEnterBranchRecords: true,
      canApproveVersions: false,
    });
  });
});

describe("PRESETS", () => {
  it("단가·가정값 적용 권한은 어느 팀원에게도 없다 (두 사람 확인 원칙)", () => {
    for (const p of PRESETS)
      expect(p.form.flags.canApproveVersions).toBe(false);
  });

  it("sameForm은 값이 같을 때만 참이다", () => {
    const a = PRESETS[0].form;
    expect(sameForm(a, { ...a, flags: { ...a.flags } })).toBe(true);
    expect(sameForm(a, { ...a, consultAccess: "all" })).toBe(false);
  });
});
