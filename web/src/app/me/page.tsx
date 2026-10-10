import { MyPage } from "@/components/me/my-page";
import { RequireLogin } from "@/components/require-login";

export const metadata = { title: "마이페이지 · 온기로" };

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 bg-paper px-4 py-8 text-ink">
      <RequireLogin>
        <MyPage />
      </RequireLogin>
    </main>
  );
}
