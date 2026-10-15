import Image from "next/image";
import Link from "next/link";

// 온기로 로고. 원본은 PM 폴더 Work_for_AI/온기로로고.png(1024×1024, 배경 투명, 세로형).
// 머리말에는 집 아이콘만 잘라 쓴다(public/brand/onkiro-mark.png). 전체 세로형은 public/brand/onkiro-logo.png
export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      aria-label="온기로 홈"
      className="inline-flex h-12 items-center gap-2 text-xl font-bold text-ink"
    >
      <Image
        src="/brand/onkiro-mark.png"
        alt=""
        width={159}
        height={192}
        priority
        className="h-9 w-auto"
      />
      온기로
    </Link>
  );
}
