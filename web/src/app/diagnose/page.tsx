import { RequireConsent } from "@/components/require-consent";

export const metadata = { title: "빈집 진단 · 온기로" };

// 임시 화면. 진단 6단계는 task.md Phase 6에서 만든다. 지금은 로그인·동의 확인(RequireConsent)만 검증한다.
export default function DiagnosePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-4 px-4 py-16">
      <RequireConsent>
        <h1 className="text-2xl font-semibold">빈집 진단</h1>
        <p className="text-base text-zinc-600">
          로그인과 동의를 마쳤습니다. 진단 화면은 준비 중입니다.
        </p>
      </RequireConsent>
    </main>
  );
}
