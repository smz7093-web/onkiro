// PDF 리포트 인쇄 화면은 task.md 8.1에서 만든다. 버튼을 누른 시점의 스냅샷 id를 받는다(7.4).
export default async function ReportPage({
  searchParams,
}: PageProps<"/diagnose/[id]/report">) {
  const { snapshot } = await searchParams;
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-semibold">PDF 리포트</h1>
      <p className="text-base text-ink-2">
        리포트 화면은 준비 중입니다. 결과는 저장되었습니다
        {typeof snapshot === "string" && ` (스냅샷 ${snapshot.slice(0, 8)})`}.
      </p>
    </div>
  );
}
