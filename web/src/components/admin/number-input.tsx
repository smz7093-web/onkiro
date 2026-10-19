"use client";

import { useState } from "react";
import { formatNumberInput, parseLenientNumber } from "@/lib/parse-number";

// 관리 화면 숫자 칸 (UX기준 30 포스텔): 쉼표·공백·'원'·'만'을 받고, 칸을 벗어나면 천 단위 쉼표로 보인다.
// 읽을 수 없는 값은 값을 바꾸지 않고 칸을 빨갛게 표시한다.
export function NumberInput({
  value,
  onChange,
  percent = false,
  readOnly = false,
  className,
  placeholder,
  id,
  "aria-label": ariaLabel,
}: {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  percent?: boolean;
  readOnly?: boolean;
  className: string;
  placeholder?: string;
  id?: string;
  "aria-label"?: string;
}) {
  const toShown = (v: number | undefined) =>
    formatNumberInput(
      v === undefined ? undefined : percent ? Number((v * 100).toFixed(6)) : v,
    );
  const [text, setText] = useState<string | null>(null); // 입력 중일 때만 글자 그대로
  const [bad, setBad] = useState(false);
  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      aria-label={ariaLabel}
      aria-invalid={bad || undefined}
      className={`${className} ${bad ? "border-crit" : ""}`}
      readOnly={readOnly}
      placeholder={placeholder}
      value={text ?? toShown(value)}
      onFocus={() => setText(toShown(value))}
      onBlur={() => {
        setText(null);
        setBad(false);
      }}
      onChange={(e) => {
        setText(e.target.value);
        const n = parseLenientNumber(e.target.value);
        if (n === null) return setBad(true);
        setBad(false);
        onChange(n === undefined ? undefined : percent ? n / 100 : n);
      }}
    />
  );
}
