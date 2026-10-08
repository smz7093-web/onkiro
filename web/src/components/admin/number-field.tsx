"use client";

import { useId } from "react";

// 숫자 입력. percent면 0.15를 15로 보여주고 저장할 때 다시 0.15로 바꾼다.
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
  const shown =
    value === undefined
      ? ""
      : percent
        ? Number((value * 100).toFixed(6))
        : value;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm text-zinc-700">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          className="h-11 w-full min-w-0 rounded-md border border-zinc-300 px-3 text-base read-only:bg-zinc-50"
          value={shown}
          readOnly={readOnly}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") return onChange(undefined);
            const n = Number(raw);
            if (Number.isFinite(n)) onChange(percent ? n / 100 : n);
          }}
        />
        {(unit || percent) && (
          <span className="shrink-0 text-sm text-zinc-600">
            {percent ? "%" : unit}
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}
