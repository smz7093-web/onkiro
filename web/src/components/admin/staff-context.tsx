"use client";

import type { User } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { MfaEnroll, MfaRelogin } from "@/components/admin/mfa-enroll";
import { hasTotpEnrolled, isMfaSession } from "@/lib/auth/mfa";
import { useAuthUser } from "@/lib/auth/use-auth-user";
import { useMemberName } from "@/lib/auth/use-member-name";
import { usePermissions } from "@/lib/auth/use-permissions";
import type { Permissions } from "@/lib/permissions";

interface Staff {
  user: User;
  name: string | null;
  permissions: Permissions;
}

const StaffContext = createContext<Staff | null>(null);

export function useStaff() {
  const staff = useContext(StaffContext);
  if (!staff) throw new Error("useStaff는 RequireStaff 안에서만 쓴다");
  return staff;
}

// 운영팀·관리자만 관리자 화면을 본다. 화면 보호일 뿐이며 실제 접근은 보안 규칙이 막는다.
// 2단계 인증(task.md 11.3): 등록 전이면 등록 화면, 등록했지만 이번 로그인이 2단계를 안 거쳤으면 다시 로그인.
export function RequireStaff({ children }: { children: ReactNode }) {
  const user = useAuthUser();
  const { permissions } = usePermissions(user);
  const isStaff = !!permissions && permissions.role !== "member";
  // uid별로 보관해 다른 계정의 판정이 잠깐이라도 쓰이지 않게 한다
  const [mfa, setMfa] = useState<{
    uid: string;
    state: "ok" | "enroll" | "relogin";
  } | null>(null);

  useEffect(() => {
    if (!user || !isStaff) return;
    let cancelled = false;
    isMfaSession(user).then((ok) => {
      if (cancelled) return;
      setMfa({
        uid: user.uid,
        state: ok ? "ok" : hasTotpEnrolled(user) ? "relogin" : "enroll",
      });
    });
    return () => {
      cancelled = true;
    };
  }, [user, isStaff]);

  if (user && isStaff) {
    const state = mfa?.uid === user.uid ? mfa.state : null;
    if (!state) return <p className="text-base">확인 중…</p>;
    if (state === "enroll")
      return (
        <MfaEnroll
          user={user}
          onDone={() => setMfa({ uid: user.uid, state: "ok" })}
        />
      );
    if (state === "relogin") return <MfaRelogin />;
  }
  return <StaffGate>{children}</StaffGate>;
}

function StaffGate({ children }: { children: ReactNode }) {
  const user = useAuthUser();
  const { permissions } = usePermissions(user);
  const name = useMemberName(user);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (user === null)
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [user, pathname, router]);

  if (!user || !permissions) return <p className="text-base">확인 중…</p>;
  if (permissions.role === "member") {
    return (
      <p role="alert" className="text-base">
        운영팀 계정만 볼 수 있는 화면입니다.
      </p>
    );
  }
  return (
    <StaffContext.Provider value={{ user, name, permissions }}>
      {children}
    </StaffContext.Provider>
  );
}
