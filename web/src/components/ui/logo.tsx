import Link from "next/link";

// 온기로 로고 (목업 .app-logo: 초록 네모 '온' + 이름). 공식 로고 파일이 오면 이 파일만 바꾼다.
export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      aria-label="온기로 홈"
      className="inline-flex h-12 items-center gap-2 text-xl font-bold text-ink"
    >
      <span
        aria-hidden
        className="grid size-8 place-items-center rounded-lg bg-accent text-base text-accent-ink"
      >
        온
      </span>
      온기로
    </Link>
  );
}
