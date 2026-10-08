import { safeNextPath } from "@/lib/safe-next";
import { ConsentForm } from "./consent-form";

export const metadata = { title: "약관 동의 · 온기로" };

export default async function ConsentPage(props: PageProps<"/consent">) {
  const { next } = await props.searchParams;
  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col justify-center gap-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">서비스 이용 동의</h1>
      <ConsentForm
        next={safeNextPath(typeof next === "string" ? next : null)}
      />
    </main>
  );
}
