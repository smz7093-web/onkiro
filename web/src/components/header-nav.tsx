"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuthUser } from "@/lib/auth/use-auth-user";
import { useSocialValue } from "@/lib/site-content/store";
import { cx } from "./ui/cx";

// 머리말 메뉴 버튼 (11/26 PM 요청: 사회적 가치·마이페이지를 보기 좋은 버튼으로).
// 둥근 알약 모양 + 작은 그림. 높이 44px(터치 기준), 지금 보는 화면은 진하게(aria-current).
// soft: 사회적 가치(연한 초록 바탕), outline: 마이페이지(흰 바탕 테두리), solid: 로그인(진한 초록, 눈에 띄게)
type Tone = "soft" | "outline" | "solid";

const TONE: Record<Tone, { base: string; on: string }> = {
  soft: {
    base: "border-transparent bg-accent-soft text-accent hover:border-accent/40",
    on: "border-accent bg-accent-soft text-accent",
  },
  outline: {
    base: "border-line-2 bg-surface text-ink hover:border-accent hover:text-accent",
    on: "border-accent bg-accent-soft text-accent",
  },
  solid: {
    base: "border-accent bg-accent text-accent-ink hover:brightness-110",
    on: "border-accent bg-accent text-accent-ink",
  },
};

export function HeaderPill({
  href,
  tone,
  icon,
  active,
  children,
}: {
  href: string;
  tone: Tone;
  icon: ReactNode;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cx(
        "inline-flex h-11 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold whitespace-nowrap transition-colors sm:px-4 sm:text-base",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        active ? TONE[tone].on : TONE[tone].base,
      )}
    >
      <span aria-hidden="true" className="size-5 shrink-0">
        {icon}
      </span>
      {children}
    </Link>
  );
}

const svg = "size-5 fill-none stroke-current";

// 새싹 (빈집에서 다시 자라는 지역)
export const SproutIcon = (
  <svg
    viewBox="0 0 24 24"
    className={svg}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 21v-9" />
    <path d="M12 12c0-4 3-7 8-7 0 4-3 7-8 7Z" />
    <path d="M12 14c0-3.3-2.5-6-6.5-6 0 3.3 2.5 6 6.5 6Z" />
  </svg>
);

// 사람
export const UserIcon = (
  <svg
    viewBox="0 0 24 24"
    className={svg}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

// 사회적 가치 버튼. 관리 화면에서 켰을 때만 보인다
export function SocialValuePill() {
  const content = useSocialValue();
  const pathname = usePathname();
  if (!content?.enabled) return null;
  return (
    <HeaderPill
      href="/social-value"
      tone="soft"
      icon={SproutIcon}
      active={pathname === "/social-value"}
    >
      사회적 가치
    </HeaderPill>
  );
}

// 로그인 전에는 '로그인'(보던 화면으로 돌아오게), 로그인 후·확인 중에는 '마이페이지'
export function AccountPill() {
  const user = useAuthUser();
  const pathname = usePathname();
  if (user === null)
    return (
      <HeaderPill
        href={`/login?next=${encodeURIComponent(pathname)}`}
        tone="solid"
        icon={UserIcon}
        active={false}
      >
        로그인
      </HeaderPill>
    );
  return (
    <HeaderPill
      href="/me"
      tone="outline"
      icon={UserIcon}
      active={pathname === "/me"}
    >
      마이페이지
    </HeaderPill>
  );
}

// 공개 화면 머리말 오른쪽 메뉴
export function HeaderNav() {
  return (
    <nav aria-label="사이트 메뉴" className="flex items-center gap-2">
      <SocialValuePill />
      <AccountPill />
    </nav>
  );
}
