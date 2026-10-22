import { RequireConsent } from "@/components/require-consent";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { ReserveForm } from "@/components/stay/reserve-form";

// 숙소 예약 신청 (STY-06, task.md 9.8). 로그인·필수 동의 후 신청한다
export const metadata = { title: "예약 신청 · 온기로" };

export default async function ReservePage({
  params,
}: PageProps<"/stay/[id]/reserve">) {
  const { id } = await params;
  return (
    <div className="flex flex-1 flex-col bg-paper text-ink">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
        <RequireConsent>
          <ReserveForm branchId={id} />
        </RequireConsent>
      </main>
      <SiteFooter />
    </div>
  );
}
