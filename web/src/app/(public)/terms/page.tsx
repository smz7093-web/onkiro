import { LegalPage } from "@/components/legal/legal-page";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export const metadata = { title: "이용약관 · 온기로" };

export default function TermsPage() {
  return (
    <div className="flex flex-1 flex-col bg-paper text-ink">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
        <LegalPage kind="terms" />
      </main>
      <SiteFooter />
    </div>
  );
}
