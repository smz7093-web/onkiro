"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuthUser } from "@/lib/auth/use-auth-user";
import { loadConsentStatus } from "@/lib/consent/store";

// 로그인과 필수 동의를 마친 회원만 children을 본다 (진단 시작 전 확인, prd.md 5절·6.7).
export function RequireConsent({ children }: { children: ReactNode }) {
  const user = useAuthUser();
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (user === undefined) return;
    const next = encodeURIComponent(pathname);
    if (user === null) {
      router.replace(`/login?next=${next}`);
      return;
    }
    let cancelled = false;
    loadConsentStatus(user.uid).then((status) => {
      if (cancelled) return;
      if (status.complete) setAllowed(true);
      else router.replace(`/consent?next=${next}`);
    });
    return () => {
      cancelled = true;
    };
  }, [user, pathname, router]);

  if (!allowed) return <p className="text-base">확인 중…</p>;
  return <>{children}</>;
}
