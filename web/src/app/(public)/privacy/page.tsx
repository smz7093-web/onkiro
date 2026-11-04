import { LegalPage } from "@/components/legal/legal-page";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export const metadata = { title: "개인정보 처리방침 · 온기로" };

export default function PrivacyPage() {
  return (
    <div className="flex flex-1 flex-col bg-paper text-ink">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
        <LegalPage kind="privacy" />
      </main>
      <SiteFooter />
    </div>
  );
}
