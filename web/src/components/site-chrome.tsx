import Link from "next/link";
import { Logo } from "./ui";

// 공개 화면(홈·숙소)의 머리말과 바닥글
export function SiteHeader() {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4">
        <Logo />
        <Link
          href="/me"
          className="inline-flex h-12 items-center px-2 text-base text-ink-2 underline-offset-4 hover:underline"
        >
          내 진단·상담
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 text-sm text-ink-2">
        온기로 · 충남 홍성 빈집 재생 스테이
      </div>
    </footer>
  );
}
