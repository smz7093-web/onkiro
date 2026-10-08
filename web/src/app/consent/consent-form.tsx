"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthUser } from "@/lib/auth/use-auth-user";
import { CONSENT_ITEMS, type ConsentType } from "@/lib/consent/definitions";
import type { ConsentStatus } from "@/lib/consent/evaluate";
import { loadConsentStatus, saveConsents } from "@/lib/consent/store";

type Choices = Partial<Record<ConsentType, boolean>>;

// 가입·약관 개정 시 동의 화면 (COM-04). 필수 4개를 모두 체크해야 진행한다.
export function ConsentForm({ next }: { next: string }) {
  const user = useAuthUser();
  const router = useRouter();
  const [status, setStatus] = useState<ConsentStatus | null>(null);
  const [choices, setChoices] = useState<Choices>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user === null)
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    if (!user) return;
    let cancelled = false;
    loadConsentStatus(user.uid).then((s) => {
      if (cancelled) return;
      if (s.complete) router.replace(next);
      setStatus(s);
      // 이미 동의한 선택 항목은 체크된 상태로 보여준다
      setChoices({ ...s.optional });
    });
    return () => {
      cancelled = true;
    };
  }, [user, next, router]);

  if (!user || !status) return <p className="text-base">확인 중…</p>;

  const allChecked = CONSENT_ITEMS.every((i) => choices[i.type]);
  const requiredChecked = CONSENT_ITEMS.every(
    (i) => !i.required || choices[i.type],
  );

  function toggleAll() {
    const value = !allChecked;
    setChoices(Object.fromEntries(CONSENT_ITEMS.map((i) => [i.type, value])));
  }

  async function submit() {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      await saveConsents(user.uid, choices);
      router.replace(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {status.outdatedRequired.length > 0 && (
        <p
          role="status"
          className="rounded-lg bg-amber-50 p-3 text-base text-amber-900"
        >
          약관이 바뀌어 다시 동의가 필요합니다. 동의 전에도 기존 진단과 리포트는
          볼 수 있습니다.
        </p>
      )}
      <label className="flex min-h-12 items-center gap-3 rounded-lg border border-zinc-300 px-4 text-base font-semibold">
        <input
          type="checkbox"
          className="size-5"
          checked={allChecked}
          onChange={toggleAll}
        />
        모두 동의
      </label>
      <ul className="flex flex-col gap-3">
        {CONSENT_ITEMS.map((item) => (
          <li key={item.type} className="flex flex-col gap-1">
            <label className="flex min-h-12 items-center gap-3 text-base">
              <input
                type="checkbox"
                className="size-5"
                checked={choices[item.type] === true}
                onChange={(e) =>
                  setChoices((c) => ({ ...c, [item.type]: e.target.checked }))
                }
              />
              <span>
                <span
                  className={item.required ? "text-zinc-900" : "text-zinc-600"}
                >
                  ({item.required ? "필수" : "선택"})
                </span>{" "}
                {item.label}
              </span>
            </label>
            <p className="pl-8 text-sm text-zinc-600">{item.detail}</p>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={submit}
        disabled={!requiredChecked || busy}
        className="h-12 rounded-lg bg-zinc-900 text-base font-semibold text-white disabled:opacity-40"
      >
        동의하고 계속하기
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
