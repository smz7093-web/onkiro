import Link from "next/link";
import type { ReactNode } from "react";
import { RequireConsent } from "@/components/require-consent";
import { Logo } from "@/components/ui";

export const metadata = { title: "빈집 진단 · 온기로" };

// 진단은 로그인과 필수 동의를 마친 회원만 시작한다 (prd.md 5절, task.md 6.1)
export default function DiagnoseLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-paper text-ink">
      <header className="border-b border-line bg-surface">
        {/* 왼쪽 로고는 사이트 홈으로 (10/31 PM: 진단 중에도 홈으로 갈 수 있게) */}
        <div className="mx-auto flex h-16 w-full max-w-4xl items-center gap-3 px-4">
          <Logo />
          <Link
            href="/diagnose"
            className="inline-flex h-12 items-center border-l border-line pl-3 text-base font-semibold text-ink-2"
          >
            빈집 진단
          </Link>
          <Link
            href="/me"
            className="ml-auto inline-flex h-12 items-center text-base text-ink-2 underline"
          >
            마이페이지
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6">
        <RequireConsent>{children}</RequireConsent>
      </main>
    </div>
  );
}
