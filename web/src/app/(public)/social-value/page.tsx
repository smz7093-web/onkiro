import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { SocialValuePage } from "@/components/social-value-page";

export const metadata = { title: "사회적 가치 · 온기로" };

export default function Page() {
  return (
    <div className="flex flex-1 flex-col bg-paper text-ink">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
        <SocialValuePage />
      </main>
      <SiteFooter />
    </div>
  );
}
