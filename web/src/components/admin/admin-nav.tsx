"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthUser } from "@/lib/auth/use-auth-user";
import { usePermissions } from "@/lib/auth/use-permissions";
import { countReceived } from "@/lib/consult/store";
import { countRequested } from "@/lib/reservations/store";
import { can, type Permissions } from "@/lib/permissions";
import { DTag } from "./d-tag";

type Group = "운영" | "기준값" | "콘텐츠" | "계정";
type Item = {
  group: Group;
  href: string;
  label: string;
  // 이 메뉴에서 입력하는 팀원 산출물 번호 (prd.md 3.2절)
  d?: string[];
  show: (p: Permissions) => boolean;
};

const GROUPS: Group[] = ["운영", "기준값", "콘텐츠", "계정"];

const MENU: Item[] = [
  {
    group: "운영",
    href: "/admin/consults",
    label: "상담",
    d: ["D13"],
    show: (p) => p.role === "admin" || p.consultAccess !== "none",
  },
  {
    group: "운영",
    href: "/admin/reservations",
    label: "예약",
    show: (p) => can(p, "canEditContent"),
  },
  {
    group: "운영",
    href: "/admin/feedback",
    label: "사용자 피드백",
    show: () => true,
  },
  {
    group: "기준값",
    href: "/admin/prices",
    label: "단가 DB",
    d: ["D2", "D3", "D4", "D5"],
    show: () => true,
  },
  {
    group: "기준값",
    href: "/admin/assumptions",
    label: "가정값",
    d: ["D6"],
    show: () => true,
  },
  {
    group: "콘텐츠",
    href: "/admin/branches",
    label: "숙소",
    d: ["D12"],
    show: (p) => can(p, "canEditContent"),
  },
  {
    group: "기준값",
    href: "/admin/permits",
    label: "인허가 항목",
    d: ["D7"],
    show: (p) => can(p, "canEditAssumptions") || can(p, "canEditContent"),
  },
  {
    group: "기준값",
    href: "/admin/permit-knowledge",
    label: "인허가 자료(AI)",
    d: ["D7"],
    show: (p) => can(p, "canEditAssumptions") || can(p, "canEditContent"),
  },
  {
    group: "기준값",
    href: "/admin/photo-guides",
    label: "촬영 가이드",
    d: ["D9"],
    show: (p) => can(p, "canEditContent"),
  },
  {
    group: "계정",
    href: "/admin/users",
    label: "회원·권한",
    show: (p) => p.role === "admin",
  },
];

// 관리자 메뉴. 권한이 있는 메뉴만 보인다 (실제 접근은 보안 규칙이 막는다).
// 새 상담 접수는 '상담' 옆 배지로 알린다 (CON-01 접수 알림, 시연 단계).
export function AdminNav() {
  const user = useAuthUser();
  const { permissions } = usePermissions(user);
  const pathname = usePathname();
  const [received, setReceived] = useState(0);
  const [requested, setRequested] = useState(0);
  const watchesReservations =
    !!permissions && can(permissions, "canEditContent");
  const watchesAll =
    permissions?.role === "admin" || permissions?.consultAccess === "all";

  useEffect(() => {
    if (!watchesAll) return;
    let cancelled = false;
    countReceived().then(
      (n) => !cancelled && setReceived(n),
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, [watchesAll]);

  useEffect(() => {
    if (!watchesReservations) return;
    let cancelled = false;
    countRequested().then(
      (n) => !cancelled && setRequested(n),
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, [watchesReservations, pathname]);

  if (!permissions || permissions.role === "member") return null;
  const visible = MENU.filter((m) => m.show(permissions));
  // 메뉴를 4묶음으로 (UX기준 1 밀러·13 공통 영역), 지금 있는 메뉴는 강조 (16 폰 레스토프)
  const groups = GROUPS.map((g) => ({
    g,
    items: visible.filter((m) => m.group === g),
  })).filter((x) => x.items.length > 0);
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2">
      {groups.map(({ g, items }) => (
        <div key={g} className="flex flex-wrap items-center gap-1">
          <span className="pr-1 text-xs font-semibold text-muted">{g}</span>
          {items.map((m) => {
            const on = pathname === m.href || pathname.startsWith(`${m.href}/`);
            return (
              <Link
                key={m.href}
                href={m.href}
                aria-current={on ? "page" : undefined}
                className={`inline-flex h-10 items-center gap-1 rounded-md px-2 text-base ${
                  on
                    ? "bg-accent-soft font-semibold text-accent"
                    : "text-ink-2 hover:bg-surface-2"
                }`}
              >
                {m.label}
                {m.d && <DTag ids={m.d} />}
                {m.href === "/admin/consults" && received > 0 && (
                  <span
                    className="rounded-full bg-crit px-2 text-xs font-semibold text-white"
                    aria-label={`새 접수 ${received}건`}
                  >
                    {received}
                  </span>
                )}
                {m.href === "/admin/reservations" && requested > 0 && (
                  <span
                    className="rounded-full bg-crit px-2 text-xs font-semibold text-white"
                    aria-label={`확인 중인 예약 ${requested}건`}
                  >
                    {requested}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}
