import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebase/client";
import { formFromDoc, toCallableInput, type PermissionForm } from "./form";

// 회원 목록과 권한 변경 (ADM-05). 회원 문서 읽기는 관리자만 된다 (firestore.rules users).
// 권한 변경은 관리자 함수 setUserPermissions만 한다. 바뀐 권한은 syncUserClaims가 토큰에 옮긴다.

export interface Member {
  uid: string;
  name: string | null;
  createdAt: Date | null;
  form: PermissionForm;
}

// 시연·베타 규모(수백 명)에서는 한 번에 읽는다. 늘어나면 페이지 나누기를 넣는다.
const MAX_MEMBERS = 500;

export async function listMembers(): Promise<Member[]> {
  const snap = await getDocs(
    query(
      collection(db, "users"),
      orderBy("createdAt", "desc"),
      limit(MAX_MEMBERS),
    ),
  );
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      uid: d.id,
      name: (data.name as string) ?? null,
      createdAt:
        data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null,
      form: formFromDoc(data),
    };
  });
}

export async function savePermissions(uid: string, form: PermissionForm) {
  const call = httpsCallable<
    ReturnType<typeof toCallableInput>,
    { ok: boolean }
  >(functions, "setUserPermissions");
  await call(toCallableInput(uid, form));
}
