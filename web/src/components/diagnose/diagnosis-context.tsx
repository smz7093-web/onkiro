"use client";

import type { User } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuthUser } from "@/lib/auth/use-auth-user";
import { usePermissions } from "@/lib/auth/use-permissions";
import { canOpen, isStepId, type StepId } from "@/lib/diagnosis/steps";
import {
  loadDiagnosis,
  type Assessment,
  type Property,
} from "@/lib/diagnosis/store";

interface DiagnosisState {
  user: User;
  // 운영팀·관리자 (사진 단계는 사진 정책 확정 전까지 이들에게만 연다, task.md 6.4)
  isTeam: boolean;
  assessment: Assessment;
  property: Property | null;
  // 저장 뒤 서버 값으로 다시 읽는다
  reload: () => Promise<void>;
  // 단계 저장 후 다음 화면으로
  go: (step: StepId) => void;
}

const Ctx = createContext<DiagnosisState | null>(null);

export function useDiagnosis() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDiagnosis는 DiagnosisProvider 안에서만 쓴다");
  return v;
}

// 진단 하나를 읽어 단계 화면에 나눠 준다. 도달하지 않은 단계 주소로 들어오면 도달한 단계로 보낸다.
export function DiagnosisProvider({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  const user = useAuthUser();
  const { permissions } = usePermissions(user);
  const router = useRouter();
  const pathname = usePathname();
  const [data, setData] = useState<{
    assessment: Assessment;
    property: Property | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apply = useCallback(
    (loaded: Awaited<ReturnType<typeof loadDiagnosis>>) => {
      if (!loaded) setError("진단을 찾을 수 없습니다.");
      else setData(loaded);
    },
    [],
  );
  const failed = useCallback(
    () => setError("진단을 불러오지 못했습니다. 본인 진단인지 확인해 주세요."),
    [],
  );

  const reload = useCallback(
    () => loadDiagnosis(id).then(apply, failed),
    [id, apply, failed],
  );

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    loadDiagnosis(id).then(
      (loaded) => !cancelled && apply(loaded),
      () => !cancelled && failed(),
    );
    return () => {
      cancelled = true;
    };
  }, [user, id, apply, failed]);

  const current = pathname.split("/").at(-1);
  const reached = data?.assessment.reached;
  useEffect(() => {
    if (reached && isStepId(current) && !canOpen(current, reached)) {
      router.replace(`/diagnose/${id}/${reached}`);
    }
  }, [current, reached, id, router]);

  if (error)
    return (
      <p role="alert" className="text-base">
        {error}
      </p>
    );
  if (!user || !permissions || !data)
    return <p className="text-base">불러오는 중…</p>;

  return (
    <Ctx.Provider
      value={{
        user,
        isTeam: permissions.role !== "member",
        assessment: data.assessment,
        property: data.property,
        reload,
        go: (step) => router.push(`/diagnose/${id}/${step}`),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
