import Link from "next/link";
import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { RequireStaff } from "@/components/admin/staff-context";
import { Logo } from "@/components/ui";

export const metadata = { title: "관리자 · 온기로" };

// 관리자 머리말: 왼쪽 위 로고는 사이트 홈(UX기준 8 야콥), '관리자'는 관리자 첫 화면, 메뉴는 아래 줄에 묶음으로
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-paper text-ink">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-2">
          <div className="flex items-center gap-3">
            <Logo />
            <Link
              href="/admin"
              className="inline-flex h-10 items-center rounded-md bg-accent px-3 text-sm font-semibold text-accent-ink"
            >
              관리자
            </Link>
          </div>
          <nav aria-label="관리자 메뉴">
            <AdminNav />
          </nav>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
        <RequireStaff>{children}</RequireStaff>
      </main>
    </div>
  );
}
