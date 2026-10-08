import { describe, expect, it } from "vitest";
import { can, permissionsFromClaims } from "./permissions";

describe("permissionsFromClaims", () => {
  it("클레임이 없으면 일반 회원이다", () => {
    expect(permissionsFromClaims({})).toEqual({
      role: "member",
      photoAccess: "none",
      consultAccess: "none",
      perms: [],
    });
  });

  it("운영팀 클레임을 읽고 모르는 권한은 버린다", () => {
    const p = permissionsFromClaims({
      role: "staff",
      photoAccess: "none",
      consultAccess: "all",
      perms: ["canEnterBranchRecords", "canDoAnything"],
    });
    expect(p.perms).toEqual(["canEnterBranchRecords"]);
    expect(can(p, "canEnterBranchRecords")).toBe(true);
    expect(can(p, "canEditPrices")).toBe(false);
  });

  it("관리자는 모든 권한이 있다", () => {
    expect(
      can(permissionsFromClaims({ role: "admin" }), "canApproveVersions"),
    ).toBe(true);
  });
});
