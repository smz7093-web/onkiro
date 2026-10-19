"use client";

import { useId } from "react";
import { NumberInput } from "./number-input";

// 숫자 입력. percent면 0.15를 15로 보여주고 저장할 때 다시 0.15로 바꾼다. 쉼표·단위·'만'도 받는다(NumberInput).
export function NumberField({
  label,
  value,
  onChange,
  unit,
  percent = false,
  readOnly = false,
  hint,
}: {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  unit?: string;
  percent?: boolean;
  readOnly?: boolean;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm text-ink-2">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <NumberInput
          id={id}
          className="h-11 w-full min-w-0 rounded-md border border-line-2 bg-surface px-3 text-base read-only:bg-surface-2"
          value={value}
          percent={percent}
          readOnly={readOnly}
          onChange={onChange}
        />
        {(unit || percent) && (
          <span className="shrink-0 text-sm text-ink-2">
            {percent ? "%" : unit}
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}
