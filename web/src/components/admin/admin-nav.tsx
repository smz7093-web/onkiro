"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthUser } from "@/lib/auth/use-auth-user";
import { usePermissions } from "@/lib/auth/use-permissions";
import { countReceived } from "@/lib/consult/store";
import { can, type Permissions } from "@/lib/permissions";

type Item = { href: string; label: string; show: (p: Permissions) => boolean };

const MENU: Item[] = [
  {
    href: "/admin/consults",
    label: "상담",
    show: (p) => p.role === "admin" || p.consultAccess !== "none",
  },
  { href: "/admin/prices", label: "단가 DB", show: () => true },
  { href: "/admin/assumptions", label: "가정값", show: () => true },
  {
    href: "/admin/branches",
    label: "숙소",
    show: (p) => can(p, "canEditContent"),
  },
  {
    href: "/admin/permits",
    label: "인허가 항목",
    show: (p) => can(p, "canEditAssumptions") || can(p, "canEditContent"),
  },
  {
    href: "/admin/photo-guides",
    label: "촬영 가이드",
    show: (p) => can(p, "canEditContent"),
  },
  { href: "/admin/users", label: "회원·권한", show: (p) => p.role === "admin" },
];

// 관리자 메뉴. 권한이 있는 메뉴만 보인다 (실제 접근은 보안 규칙이 막는다).
// 새 상담 접수는 '상담' 옆 배지로 알린다 (CON-01 접수 알림, 시연 단계).
export function AdminNav() {
  const user = useAuthUser();
  const { permissions } = usePermissions(user);
  const [received, setReceived] = useState(0);
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

  if (!permissions || permissions.role === "member") return null;
  return (
    <>
      {MENU.filter((m) => m.show(permissions)).map((m) => (
        <Link
          key={m.href}
          href={m.href}
          className="inline-flex items-center gap-1 text-base text-zinc-700 hover:underline"
        >
          {m.label}
          {m.href === "/admin/consults" && received > 0 && (
            <span
              className="rounded-full bg-red-600 px-2 text-xs font-semibold text-white"
              aria-label={`새 접수 ${received}건`}
            >
              {received}
            </span>
          )}
        </Link>
      ))}
    </>
  );
}
