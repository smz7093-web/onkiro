import type { User } from "firebase/auth";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase/client";

// 회원 문서 users/{uid}. 본인은 role이 member인 문서만 만들 수 있다 (firestore.rules).
// 운영팀 권한 필드는 관리자 함수만 바꾼다 (task.md 2.3).
// 로그인 직후 버튼 처리와 로그인 상태 감지가 동시에 부를 수 있어 트랜잭션으로 한 번만 만든다.
export async function ensureMemberDoc(user: User, nickname: string | null) {
  const ref = doc(db, "users", user.uid);
  const name = nickname ?? user.displayName ?? null;
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) {
      tx.set(ref, { name, role: "member", createdAt: serverTimestamp() });
    } else if (name && !snap.data().name) {
      // 먼저 이름 없이 만들어졌다면 카카오 닉네임으로 채운다
      tx.update(ref, { name });
    }
  });
}
