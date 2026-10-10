import Link from "next/link";
import type { ReactNode } from "react";
import { RequireConsent } from "@/components/require-consent";

export const metadata = { title: "빈집 진단 · 온기로" };

// 진단은 로그인과 필수 동의를 마친 회원만 시작한다 (prd.md 5절, task.md 6.1)
export default function DiagnoseLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-paper text-ink">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-4 px-4 py-3">
          <Link href="/diagnose" className="text-lg font-semibold">
            온기로 빈집 진단
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6">
        <RequireConsent>{children}</RequireConsent>
      </main>
    </div>
  );
}
