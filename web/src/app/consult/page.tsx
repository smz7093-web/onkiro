export const metadata = { title: "상담 신청 · 온기로" };

// 상담 신청 폼은 task.md 9.1에서 만든다. 결과 화면의 버튼이 진단·스냅샷 id와 상담 유형을 넘긴다(7.5).
export default async function ConsultPage({
  searchParams,
}: PageProps<"/consult">) {
  const { type } = await searchParams;
  const label =
    type === "inspection"
      ? "현장진단"
      : type === "turnkey"
        ? "턴키 PM"
        : "상담";
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-3 px-4 py-16">
      <h1 className="text-2xl font-semibold">{label} 신청</h1>
      <p className="text-base text-zinc-600">
        상담 신청 화면은 준비 중입니다. 진단 결과는 저장되어 있어, 신청 화면이
        열리면 자동으로 연결됩니다.
      </p>
    </main>
  );
}
