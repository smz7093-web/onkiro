import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { StayDetail } from "./stay-detail";

// 숙소 상세 (STY-01·02, task.md 9.3). 내용은 관리자 화면 /admin/branches에서 고친다(배포 없이).
// 개발 중 확인 주소: /stay/onkiro-1(실제), /stay/sample-1(샘플)
export const metadata = { title: "숙소 · 온기로" };

export default async function StayPage({ params }: PageProps<"/stay/[id]">) {
  const { id } = await params;
  return (
    <div className="flex flex-1 flex-col bg-paper text-ink">
      <SiteHeader />
      <StayDetail id={id} />
      <SiteFooter />
    </div>
  );
}
