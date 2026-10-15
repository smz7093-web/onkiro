import Link from "next/link";
import type { ComponentProps } from "react";
import { cx } from "./cx";

// 버튼 (목업 .btn). 주요 버튼은 높이 48px(h-12), 글자 16px.
// sm은 표 안의 작은 동작(편집·삭제 등)에만 쓴다.
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "md" | "sm";

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "border-accent bg-accent font-semibold text-accent-ink hover:brightness-110",
  secondary: "border-line-2 bg-surface text-ink hover:border-accent",
  ghost: "border-transparent bg-transparent text-accent underline",
  danger: "border-crit bg-transparent text-crit hover:bg-crit-soft",
};

const SIZE: Record<ButtonSize, string> = {
  md: "h-12 px-5 text-base",
  sm: "h-10 px-3 text-sm",
};

type Style = { variant?: ButtonVariant; size?: ButtonSize; block?: boolean };

export function buttonClass({
  variant = "secondary",
  size = "md",
  block = false,
}: Style = {}) {
  return cx(
    "inline-flex items-center justify-center gap-1.5 rounded-lg border text-center transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    "disabled:cursor-not-allowed disabled:opacity-40 aria-disabled:pointer-events-none aria-disabled:opacity-40",
    VARIANT[variant],
    SIZE[size],
    block && "w-full",
  );
}

export function Button({
  variant,
  size,
  block,
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & Style) {
  return (
    <button
      type={type}
      className={cx(buttonClass({ variant, size, block }), className)}
      {...props}
    />
  );
}

// 버튼 모양의 링크 (화면 이동)
export function ButtonLink({
  variant,
  size,
  block,
  className,
  ...props
}: ComponentProps<typeof Link> & Style) {
  return (
    <Link
      className={cx(buttonClass({ variant, size, block }), className)}
      {...props}
    />
  );
}
