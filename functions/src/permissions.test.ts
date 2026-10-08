import { describe, expect, it } from "vitest";
import {
  claimsFromPermissions,
  permissionFieldsFromInput,
  permissionsFromDoc,
  sameClaims,
} from "./permissions";

describe("permissionsFromDoc", () => {
  it("문서가 없거나 role이 잘못되면 member로 본다", () => {
    expect(permissionsFromDoc(undefined).role).toBe("member");
    expect(permissionsFromDoc({ role: "superuser" }).role).toBe("member");
  });

  it("member는 필드가 있어도 권한이 없다", () => {
    const p = permissionsFromDoc({ role: "member", photoAccess: "all", canEditPrices: true });
    expect(p.photoAccess).toBe("none");
    expect(p.flags.canEditPrices).toBe(false);
  });

  it("admin은 모든 권한을 가진다", () => {
    const c = claimsFromPermissions(permissionsFromDoc({ role: "admin" }));
    expect(c.photoAccess).toBe("all");
    expect(c.consultAccess).toBe("all");
    expect(c.perms).toHaveLength(7);
  });

  it("석원 계정 예시 (prd.md 4절)", () => {
    const c = claimsFromPermissions(
      permissionsFromDoc({
        role: "staff",
        photoAccess: "all",
        consultAccess: "assigned",
        canEditPrices: true,
        canReviewDiagnosis: true,
        canReviewCosts: true,
        canApproveVersions: "yes", // 불린이 아니면 꺼진 것으로 본다
      }),
    );
    expect(c).toEqual({
      role: "staff",
      photoAccess: "all",
      consultAccess: "assigned",
      perms: ["canEditPrices", "canReviewDiagnosis", "canReviewCosts"],
    });
  });

  it("staff의 잘못된 접근 범위는 none으로 본다", () => {
    expect(permissionsFromDoc({ role: "staff", photoAccess: "everything" }).photoAccess).toBe("none");
  });
});

describe("sameClaims", () => {
  const next = { role: "staff" as const, photoAccess: "none" as const, consultAccess: "all" as const, perms: ["canEnterBranchRecords" as const] };
  it("순서만 다른 같은 권한은 같다", () => {
    expect(sameClaims({ ...next, perms: ["canEnterBranchRecords"] }, next)).toBe(true);
  });
  it("클레임이 없거나 다르면 다르다", () => {
    expect(sameClaims(undefined, next)).toBe(false);
    expect(sameClaims({ ...next, consultAccess: "assigned" }, next)).toBe(false);
  });
});

describe("permissionFieldsFromInput", () => {
  it("빠진 값은 가장 좁은 권한으로 채운다", () => {
    const r = permissionFieldsFromInput({ role: "staff", canEditContent: true });
    expect(r).toEqual({
      ok: true,
      fields: {
        role: "staff",
        photoAccess: "none",
        consultAccess: "none",
        canEditPrices: false,
        canEditAssumptions: false,
        canApproveVersions: false,
        canEditContent: true,
        canReviewDiagnosis: false,
        canReviewCosts: false,
        canEnterBranchRecords: false,
      },
    });
  });
  it("잘못된 값은 거부한다", () => {
    expect(permissionFieldsFromInput({ role: "owner" }).ok).toBe(false);
    expect(permissionFieldsFromInput({ role: "staff", photoAccess: "some" }).ok).toBe(false);
    expect(permissionFieldsFromInput({ role: "staff", canEditPrices: "true" }).ok).toBe(false);
  });
});
