import { LawChangeEditor } from "@/components/admin/law-change-editor";
import { PermitEditor } from "@/components/admin/permit-editor";

export default function PermitsPage() {
  return (
    <div className="flex flex-col gap-12">
      <PermitEditor />
      <LawChangeEditor />
    </div>
  );
}
