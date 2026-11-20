"use client";

import type { User } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import QRCode from "qrcode";
import { useState } from "react";
import { TotpCodeForm } from "@/components/auth/totp-code-form";
import { Button, Card, Notice } from "@/components/ui";
import {
  finishTotpEnrollment,
  mfaErrorMessage,
  startTotpEnrollment,
  type TotpEnrollment,
} from "@/lib/auth/mfa";
import { signOutUser } from "@/lib/firebase/kakao";

// 운영팀 2단계 인증 등록 화면 (task.md 11.3). 등록하지 않은 staff·admin은 관리 화면 대신 이 화면을 본다.
export function MfaEnroll({
  user,
  onDone,
}: {
  user: User;
  onDone: () => void;
}) {
  const [enrollment, setEnrollment] = useState<
    (TotpEnrollment & { qr: string }) | null
  >(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needRelogin, setNeedRelogin] = useState(false);

  async function start() {
    setError(null);
    setBusy(true);
    try {
      const e = await startTotpEnrollment(user);
      const qr = await QRCode.toDataURL(e.otpauthUrl, {
        margin: 1,
        width: 220,
      });
      setEnrollment({ ...e, qr });
    } catch (e) {
      setError(mfaErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function finish(code: string) {
    if (!enrollment) return;
    setError(null);
    setBusy(true);
    try {
      const ok = await finishTotpEnrollment(user, enrollment.secret, code);
      if (ok) onDone();
      else setNeedRelogin(true);
    } catch (e) {
      setError(mfaErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (needRelogin)
    return (
      <MfaRelogin message="등록이 끝났습니다. 인증 앱 숫자로 다시 로그인해 주세요." />
    );

  return (
    <Card className="max-w-xl">
      <h1 className="text-xl font-bold">2단계 인증 등록</h1>
      <p className="text-base">
        관리 화면은 회원 사진·상담 기록을 다루므로, 카카오 로그인 뒤 휴대폰 인증
        앱의 6자리 숫자를 한 번 더 확인합니다. 처음 한 번만 등록하면 됩니다.
      </p>
      {!enrollment ? (
        <>
          <ol className="list-decimal pl-5 text-base">
            <li>
              휴대폰에 인증 앱을 설치합니다 (Google Authenticator 또는 Microsoft
              Authenticator, 무료).
            </li>
            <li>아래 버튼을 누르면 QR 코드가 나옵니다.</li>
            <li>인증 앱에서 QR 코드를 찍고, 앱에 뜬 6자리 숫자를 넣습니다.</li>
          </ol>
          <Button variant="primary" onClick={start} disabled={busy}>
            {busy ? "준비 중…" : "등록 시작"}
          </Button>
        </>
      ) : (
        <>
          <div className="flex flex-col items-start gap-3 sm:flex-row">
            {/* eslint-disable-next-line @next/next/no-img-element -- 브라우저에서 만든 QR 데이터 주소 */}
            <img
              src={enrollment.qr}
              alt="인증 앱으로 찍을 QR 코드"
              width={220}
              height={220}
              className="rounded-md border border-line"
            />
            <div className="flex flex-col gap-2 text-base">
              <p>인증 앱에서 &lsquo;QR 코드 스캔&rsquo;으로 찍어 주세요.</p>
              <p className="text-sm text-muted">
                이 휴대폰에서 보고 있다면{" "}
                <a
                  href={enrollment.otpauthUrl}
                  className="text-accent underline"
                >
                  인증 앱에서 열기
                </a>
                , 또는 앱에서 &lsquo;설정 키 입력&rsquo;에 아래 키를 넣습니다.
              </p>
              <code className="break-all rounded bg-surface-2 px-2 py-1 font-mono text-sm">
                {enrollment.secretKey.replace(/(.{4})/g, "$1 ").trim()}
              </code>
            </div>
          </div>
          <TotpCodeForm submitLabel="등록" busy={busy} onSubmit={finish} />
          <p className="text-sm text-muted">
            휴대폰을 바꾸거나 인증 앱을 지우면 로그인할 수 없습니다. 그때는
            관리자(PM)에게 초기화를 부탁해 주세요.
          </p>
        </>
      )}
      {error && (
        <Notice tone="crit" role="alert">
          {error}
        </Notice>
      )}
    </Card>
  );
}

// 등록은 했지만 지금 로그인이 2단계 인증을 거치지 않은 경우 (등록 전에 로그인했거나 다른 기기)
export function MfaRelogin({ message }: { message?: string }) {
  const router = useRouter();
  const pathname = usePathname();

  async function relogin() {
    await signOutUser();
    router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }

  return (
    <Card className="max-w-xl">
      <h1 className="text-xl font-bold">2단계 인증으로 다시 로그인</h1>
      <p className="text-base">
        {message ??
          "관리 화면은 인증 앱 숫자를 확인한 로그인에서만 열립니다. 로그아웃 후 다시 로그인해 주세요."}
      </p>
      <Button variant="primary" onClick={relogin}>
        다시 로그인
      </Button>
    </Card>
  );
}
