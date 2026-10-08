import { LoginPanel } from "./login-panel";

export const metadata = { title: "로그인 · 온기로" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center gap-6 px-4 py-16">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold">온기로 시작하기</h1>
        <p className="text-base text-zinc-600">
          진단 결과를 저장하고 상담을 신청하려면 로그인하세요.
        </p>
      </div>
      <LoginPanel />
    </main>
  );
}
