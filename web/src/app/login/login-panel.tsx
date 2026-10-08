"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase/client";
import { signInWithKakao, signOutUser } from "@/lib/firebase/kakao";

// 임시 로그인 확인 화면. 약관 동의(COM-04)와 회원 문서 생성은 task.md 2.2·2.3에서 붙인다.
export function LoginPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(
    () =>
      onAuthStateChanged(auth, (next) => {
        setUser(next);
        setReady(true);
      }),
    [],
  );

  async function handleKakao() {
    setError(null);
    setBusy(true);
    try {
      await signInWithKakao();
    } catch (e) {
      setError(
        e instanceof FirebaseError ? `${e.code}: ${e.message}` : String(e),
      );
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return <p className="text-base">확인 중…</p>;

  if (user) {
    const kakao = user.providerData[0];
    return (
      <div className="flex flex-col gap-4">
        <p className="text-lg">로그인되었습니다.</p>
        <dl className="grid grid-cols-[8rem_1fr] gap-2 text-base">
          <dt className="text-zinc-600">이름</dt>
          <dd>{user.displayName ?? kakao?.displayName ?? "(없음)"}</dd>
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
