import type { ComponentProps, ReactNode } from "react";
import { cx } from "./cx";

// 카드 (목업 .card). flat = 배경색만 있는 보조 칸, highlight = 선택·추천 강조
export type CardVariant = "default" | "flat" | "highlight";

const VARIANT: Record<CardVariant, string> = {
  default: "border-line bg-surface",
  flat: "border-transparent bg-surface-2",
  highlight: "border-accent bg-surface ring-3 ring-accent-soft",
};

export function cardClass(variant: CardVariant = "default") {
  return cx("flex flex-col gap-3 rounded-lg border p-4", VARIANT[variant]);
}

export function Card({
  variant,
  className,
  ...props
}: ComponentProps<"section"> & { variant?: CardVariant }) {
  return <section className={cx(cardClass(variant), className)} {...props} />;
}

// 카드 머리: 제목과 오른쪽 보조 요소(배지·버튼)
export function CardHead({
  title,
  aside,
}: {
  title: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      {aside}
    </div>
  );
}
