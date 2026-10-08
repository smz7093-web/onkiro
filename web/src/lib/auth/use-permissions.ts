"use client";

import type { User } from "firebase/auth";
import { useEffect, useState } from "react";
import { permissionsFromClaims, type Permissions } from "../permissions";

// 로그인 토큰의 권한을 읽는다. 관리자가 권한을 바꾼 직후에는 refresh()로 토큰을 새로 받아야 반영된다.
export function usePermissions(user: User | null | undefined) {
  // 다른 계정의 권한이 잠깐이라도 보이지 않도록 uid와 함께 보관한다
  const [loaded, setLoaded] = useState<{
    uid: string;
    permissions: Permissions;
  } | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    user.getIdTokenResult().then((token) => {
      if (!cancelled)
        setLoaded({
          uid: user.uid,
          permissions: permissionsFromClaims(token.claims),
        });
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function refresh() {
    if (!user) return;
    const token = await user.getIdTokenResult(true);
    setLoaded({
      uid: user.uid,
      permissions: permissionsFromClaims(token.claims),
    });
  }

  const permissions =
    user && loaded?.uid === user.uid ? loaded.permissions : null;
  return { permissions, refresh };
}
