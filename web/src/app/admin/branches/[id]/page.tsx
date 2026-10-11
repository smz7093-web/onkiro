import { BranchEditor } from "@/components/admin/branch-editor";

export default async function BranchEditPage({
  params,
}: PageProps<"/admin/branches/[id]">) {
  const { id } = await params;
  return <BranchEditor id={id} />;
}
