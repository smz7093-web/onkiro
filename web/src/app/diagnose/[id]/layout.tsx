import { DiagnosisProvider } from "@/components/diagnose/diagnosis-context";
import { StepBar } from "@/components/diagnose/step-bar";

export default async function DiagnosisLayout({
  children,
  params,
}: LayoutProps<"/diagnose/[id]">) {
  const { id } = await params;
  return (
    <DiagnosisProvider id={id}>
      <div className="flex flex-col gap-6">
        <StepBar />
        {children}
      </div>
    </DiagnosisProvider>
  );
}
