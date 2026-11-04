import Link from "next/link";
import { AccountLink } from "./account-link";
import { SiteFooterInfo } from "./site-footer-info";
import { Logo } from "./ui";

// 공개 화면(홈·숙소)의 머리말과 바닥글
export function SiteHeader() {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4">
        <Logo />
        <AccountLink className="inline-flex h-12 items-center px-2 text-base text-ink-2 underline-offset-4 hover:underline" />
      </div>
    </header>
  );
}

const footerLink =
  "inline-flex h-12 items-center underline-offset-4 hover:underline";

// 바닥글: 약관·개인정보 처리방침 링크(처리방침은 굵게 — 개인정보보호법 제30조 공개 의무), 사업자 정보, 저작권
export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-6 text-sm text-ink-2">
        <div className="flex flex-wrap items-center justify-between gap-x-4">
          <span>온기로 · 충남 홍성 빈집 재생 스테이</span>
          <nav aria-label="약관·안내" className="flex flex-wrap gap-x-4">
            <Link href="/terms" className={footerLink}>
              이용약관
            </Link>
            <Link
              href="/privacy"
              className={`${footerLink} font-semibold text-ink`}
            >
              개인정보 처리방침
            </Link>
            <Link href="/feedback" className={`${footerLink} underline`}>
              의견 보내기
            </Link>
          </nav>
        </div>
        <SiteFooterInfo />
      </div>
    </footer>
  );
}
