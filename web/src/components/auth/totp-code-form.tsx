"use client";

import { useState, type FormEvent } from "react";
import { normalizeTotpCode } from "@/lib/auth/mfa";
import { Button } from "@/components/ui";

// 인증 앱의 6자리 숫자 입력 (2단계 인증 등록·로그인 공통, task.md 11.3)
export function TotpCodeForm({
  label = "인증 앱의 6자리 숫자",
  submitLabel = "확인",
  busy,
  onSubmit,
}: {
  label?: string;
  submitLabel?: string;
  busy: boolean;
  onSubmit: (code: string) => void;
}) {
  const [code, setCode] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (code.length === 6) onSubmit(code);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <label htmlFor="totp-code" className="text-base font-semibold">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id="totp-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          maxLength={7}
          value={code}
          onChange={(e) => setCode(normalizeTotpCode(e.target.value))}
          className="h-12 w-40 rounded-lg border border-line-2 bg-surface px-3 text-center font-mono text-xl tracking-[0.3em]"
          placeholder="000000"
        />
        <Button
          type="submit"
          variant="primary"
          disabled={busy || code.length !== 6}
        >
          {busy ? "확인 중…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
