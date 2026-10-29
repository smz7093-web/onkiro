"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthUser } from "@/lib/auth/use-auth-user";

// 머리말 오른쪽 링크. 로그인 전에는 '로그인'(보던 화면으로 돌아오게), 로그인 후에는 '마이페이지'.
// 로그인 확인 중에는 '마이페이지'로 둔다(/me가 로그인 전이면 로그인 화면으로 보낸다).
export function AccountLink({ className }: { className: string }) {
  const user = useAuthUser();
  const pathname = usePathname();
  if (user === null)
    return (
      <Link
        href={`/login?next=${encodeURIComponent(pathname)}`}
        className={className}
      >
        로그인
      </Link>
    );
  return (
    <Link href="/me" className={className}>
      마이페이지
    </Link>
  );
}
