"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CONSENT_ITEMS } from "@/lib/consent/definitions";
import { agreeOptionalConsent, loadConsentStatus } from "@/lib/consent/store";
import { Button, Notice } from "../ui";
import { useDiagnosis } from "./diagnosis-context";

// AI 기능 앞의 선택 동의 (D8 10/19 확정): 해외 AI 전송에 동의해야 AI 버튼이 보인다.
// 동의 기록은 users/{uid}/consents에 추가되고, 서버 함수도 같은 기록을 확인한다.
const ITEM = CONSENT_ITEMS.find((i) => i.type === "aiProcessing")!;

let cache: { uid: string; agreed: boolean } | null = null;

export function AiConsentGate({ children }: { children: ReactNode }) {
  const { user } = useDiagnosis();
  const [agreed, setAgreed] = useState<boolean | null>(
    cache?.uid === user.uid ? cache.agreed : null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (cache?.uid === user.uid) return;
    let cancelled = false;
    loadConsentStatus(user.uid).then(
      (s) => {
        const ok = s.optional.aiProcessing === true;
        cache = { uid: user.uid, agreed: ok };
        if (!cancelled) setAgreed(ok);
      },
      () => !cancelled && setAgreed(false),
    );
    return () => {
      cancelled = true;
    };
  }, [user.uid]);

  if (agreed === null) return <div className="min-h-12" aria-busy="true" />;
  if (agreed) return <>{children}</>;
  return (
    <Notice tone="info" title={ITEM.label}>
      <span className="text-sm">{ITEM.detail}</span>
      {error && (
        <span role="alert" className="text-sm text-crit">
          동의를 저장하지 못했습니다. 다시 시도해 주세요.
        </span>
      )}
      <div>
        <Button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError(false);
            try {
              await agreeOptionalConsent(user.uid, "aiProcessing");
              cache = { uid: user.uid, agreed: true };
              setAgreed(true);
            } catch {
              setError(true);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "저장 중…" : "동의하고 AI 기능 쓰기"}
        </Button>
      </div>
    </Notice>
  );
}
