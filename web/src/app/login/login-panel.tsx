"use client";

import { FirebaseError } from "firebase/app";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthUser } from "@/lib/auth/use-auth-user";
import { loadConsentStatus } from "@/lib/consent/store";
import { signInWithKakao, signOutUser } from "@/lib/firebase/kakao";
import { ensureMemberDoc } from "@/lib/users";

// 로그인 → 회원 문서 확인 → 필수 동의가 없으면 동의 화면으로 보낸다 (COM-02, COM-04).
export function LoginPanel({ next }: { next: string | null }) {
  const user = useAuthUser();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [consentDone, setConsentDone] = useState(false);

  // 이미 로그인한 상태로 들어왔을 때도 동의 여부를 확인한다
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    // 회원 문서가 없던 시점에 로그인한 계정도 문서를 갖게 한다 (닉네임은 로그인 버튼 처리에서 채운다)
    ensureMemberDoc(user, null)
      .then(() => loadConsentStatus(user.uid))
      .then((status) => {
        if (cancelled) return;
        if (!status.complete) {
          const target = next ? `?next=${encodeURIComponent(next)}` : "";
          router.replace(`/consent${target}`);
        } else if (next) {
          router.replace(next);
        } else {
          setConsentDone(true);
        }
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof FirebaseError ? e.code : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [user, next, router]);

  async function handleKakao() {
    setError(null);
    setBusy(true);
    try {
      const { user: signedIn, nickname } = await signInWithKakao();
      await ensureMemberDoc(signedIn, nickname);
    } catch (e) {
      setError(
        e instanceof FirebaseError ? `${e.code}: ${e.message}` : String(e),
      );
    } finally {
      setBusy(false);
    }
  }

  if (user === undefined) return <p className="text-base">확인 중…</p>;

  if (user) {
    if (error)
      return (
        <p role="alert" className="break-all text-sm text-red-700">
          회원 정보를 확인하지 못했습니다: {error}
        </p>
      );
    if (!consentDone) return <p className="text-base">확인 중…</p>;
    const kakao = user.providerData[0];
    return (
      <div className="flex flex-col gap-4">
        <p className="text-lg">로그인되었습니다.</p>
        <dl className="grid grid-cols-[8rem_1fr] gap-2 text-base">
          <dt className="text-zinc-600">이메일</dt>
          <dd>{user.email ?? kakao?.email ?? "(동의 안 함)"}</dd>
          <dt className="text-zinc-600">로그인 방법</dt>
          <dd>{kakao?.providerId}</dd>
          <dt className="text-zinc-600">Firebase uid</dt>
          <dd className="break-all font-mono text-sm">{user.uid}</dd>
        </dl>
        <button
          type="button"
          onClick={() => signOutUser()}
          className="h-12 rounded-lg border border-zinc-300 text-base"
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={handleKakao}
        disabled={busy}
        className="h-12 rounded-lg bg-[#FEE500] text-base font-semibold text-black/85 disabled:opacity-60"
      >
        카카오로 계속하기
      </button>
      <button
        type="button"
        disabled
        className="h-12 rounded-lg bg-[#03C75A] text-base font-semibold text-white opacity-55"
      >
        네이버로 계속하기 · 준비 중
      </button>
      {error && (
        <p role="alert" className="break-all text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
