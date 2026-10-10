"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuthUser } from "@/lib/auth/use-auth-user";

// 로그인만 확인한다. 약관 재동의 전에도 기존 진단·리포트 열람은 허용한다 (prd.md 6.7 약관 개정).
export function RequireLogin({ children }: { children: ReactNode }) {
  const user = useAuthUser();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (user === null)
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [user, pathname, router]);
  if (!user) return <p className="p-4 text-base">확인 중…</p>;
  return <>{children}</>;
}
