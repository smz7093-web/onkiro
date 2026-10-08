"use client";

import type { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../firebase/client";

// 회원 문서의 이름 (버전 작성자·적용자 표시용)
export function useMemberName(user: User | null | undefined) {
  const [loaded, setLoaded] = useState<{
    uid: string;
    name: string | null;
  } | null>(null);
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getDoc(doc(db, "users", user.uid)).then((snap) => {
      if (!cancelled)
        setLoaded({
          uid: user.uid,
          name: (snap.get("name") as string) ?? null,
        });
    });
    return () => {
      cancelled = true;
    };
  }, [user]);
  return user && loaded?.uid === user.uid ? loaded.name : null;
}
