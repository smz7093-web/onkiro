import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { FeedbackForm } from "@/components/feedback/feedback-form";

// 사용자 피드백 (10/26, 실사용자 테스트). 로그인 없이도 보낼 수 있다. ?from=/diagnose 처럼 온 화면을 받는다
export const metadata = { title: "의견 보내기 · 온기로" };

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { from } = await searchParams;
  return (
    <div className="flex flex-1 flex-col bg-paper text-ink">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
        <FeedbackForm from={typeof from === "string" ? from : null} />
      </main>
      <SiteFooter />
    </div>
  );
}
