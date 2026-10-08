import Link from "next/link";
import type { ReactNode } from "react";
import { RequireStaff } from "@/components/admin/staff-context";

export const metadata = { title: "관리자 · 온기로" };

const MENU = [
  { href: "/admin/prices", label: "단가 DB" },
  { href: "/admin/assumptions", label: "가정값" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-zinc-200 bg-white">
        <nav className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/admin" className="text-lg font-semibold">
            온기로 관리자
          </Link>
          {MENU.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="text-base text-zinc-700 hover:underline"
            >
              {m.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
        <RequireStaff>{children}</RequireStaff>
      </main>
    </div>
  );
}
