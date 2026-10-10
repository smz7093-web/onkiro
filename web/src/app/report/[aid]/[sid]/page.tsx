import { RequireLogin } from "@/components/require-login";
import { ReportView } from "@/components/report/report-view";

export const metadata = { title: "진단 리포트 · 온기로" };

// PDF 리포트 (SIM-16, task.md 8.1). 결과 화면의 'PDF 받기'와 마이페이지의 '리포트 다시 보기'가 연다.
export default async function ReportPage({
  params,
}: PageProps<"/report/[aid]/[sid]">) {
  const { aid, sid } = await params;
  return (
    <RequireLogin>
      {() => <ReportView assessmentId={aid} snapshotId={sid} />}
    </RequireLogin>
  );
}
