"use client";

import type { User } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useAuthUser } from "@/lib/auth/use-auth-user";
import { useMemberName } from "@/lib/auth/use-member-name";
import { usePermissions } from "@/lib/auth/use-permissions";
import type { Permissions } from "@/lib/permissions";

interface Staff {
  user: User;
  name: string | null;
  permissions: Permissions;
}

const StaffContext = createContext<Staff | null>(null);

export function useStaff() {
  const staff = useContext(StaffContext);
  if (!staff) throw new Error("useStaff는 RequireStaff 안에서만 쓴다");
  return staff;
}

// 운영팀·관리자만 관리자 화면을 본다. 화면 보호일 뿐이며 실제 접근은 보안 규칙이 막는다.
export function RequireStaff({ children }: { children: ReactNode }) {
  const user = useAuthUser();
  const { permissions } = usePermissions(user);
  const name = useMemberName(user);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (user === null)
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [user, pathname, router]);

  if (!user || !permissions) return <p className="text-base">확인 중…</p>;
  if (permissions.role === "member") {
    return (
      <p role="alert" className="text-base">
        운영팀 계정만 볼 수 있는 화면입니다.
      </p>
    );
  }
  return (
    <StaffContext.Provider value={{ user, name, permissions }}>
      {children}
    </StaffContext.Provider>
  );
}
