import { StayDetail } from "./stay-detail";

// 숙소 상세 (STY-01·02, task.md 9.3). 화면은 해순이 stay-detail.tsx에 만든다.
// 개발 중 확인 주소: /stay/sample-1
export default async function StayPage({ params }: PageProps<"/stay/[id]">) {
  const { id } = await params;
  return <StayDetail id={id} />;
}
