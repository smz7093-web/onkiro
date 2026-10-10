"use client";

import Link from "next/link";
import { useAuthUser } from "@/lib/auth/use-auth-user";
import { usePermissions } from "@/lib/auth/use-permissions";

const MENU = [
  { href: "/admin/prices", label: "단가 DB", adminOnly: false },
  { href: "/admin/assumptions", label: "가정값", adminOnly: false },
  { href: "/admin/users", label: "회원·권한", adminOnly: true },
];

// 관리자 메뉴. 관리자 전용 메뉴는 관리자에게만 보인다 (실제 접근은 보안 규칙이 막는다).
export function AdminNav() {
  const user = useAuthUser();
  const { permissions } = usePermissions(user);
  const isAdmin = permissions?.role === "admin";
  return (
    <>
      {MENU.filter((m) => !m.adminOnly || isAdmin).map((m) => (
        <Link
          key={m.href}
          href={m.href}
          className="text-base text-zinc-700 hover:underline"
        >
          {m.label}
        </Link>
      ))}
    </>
  );
}
