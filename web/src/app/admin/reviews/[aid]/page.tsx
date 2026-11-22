import { ReviewDetail } from "@/components/admin/review-detail";

export default async function Page(props: PageProps<"/admin/reviews/[aid]">) {
  const { aid } = await props.params;
  return <ReviewDetail assessmentId={decodeURIComponent(aid)} />;
}
