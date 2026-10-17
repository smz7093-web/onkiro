import { ConsultApply } from "@/components/consult/consult-apply";
import { RequireConsent } from "@/components/require-consent";
import { SiteHeader } from "@/components/site-chrome";

export const metadata = { title: "상담 신청 · 온기로" };

// 상담 신청 (CON-01, task.md 9.1). 결과 화면 버튼이 진단·스냅샷 id와 유형을 넘긴다(7.5).
export default async function ConsultPage({
  searchParams,
}: PageProps<"/consult">) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) =>
    typeof v === "string" ? v : null;
  return (
    <div className="flex flex-1 flex-col bg-paper text-ink">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 bg-paper px-4 py-8 text-ink">
        <RequireConsent>
          <ConsultApply
            assessmentId={one(sp.assessment)}
            snapshotId={one(sp.snapshot)}
            initialType={one(sp.type)}
          />
        </RequireConsent>
      </main>
    </div>
  );
}
