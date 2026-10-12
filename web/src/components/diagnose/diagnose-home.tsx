"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthUser } from "@/lib/auth/use-auth-user";
import { STEPS } from "@/lib/diagnosis/steps";
import {
  canDeleteAssessment,
  createAssessment,
  deleteAssessment,
  listMyAssessments,
  type Assessment,
} from "@/lib/diagnosis/store";
import { btnPrimary, card } from "./styles";

const STEP_LABEL = Object.fromEntries(STEPS.map((s) => [s.id, s.label]));

const btnLine =
  "inline-flex h-12 items-center rounded-lg border border-line-2 px-4 text-base";

// 진단 시작·이어하기·삭제 (task.md 6.1). 완료 전(draft) 진단만 삭제할 수 있고,
// 견적이 나온 진단은 개인정보 삭제 요청으로 지운다.
export function DiagnoseHome() {
  const user = useAuthUser();
  const router = useRouter();
  const [list, setList] = useState<Assessment[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 삭제 확인 중인 진단 id, 삭제 진행 중인 진단 id
  const [confirming, setConfirming] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function remove(a: Assessment) {
    setDeleting(a.id);
    setError(null);
    try {
      await deleteAssessment(a);
      setList((l) => l?.filter((x) => x.id !== a.id) ?? null);
      setConfirming(null);
    } catch {
      setError("진단을 삭제하지 못했습니다. 잠시 뒤 다시 시도해 주세요.");
    } finally {
      setDeleting(null);
    }
  }

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    listMyAssessments(user.uid)
      .then((l) => !cancelled && setList(l))
      .catch(() => !cancelled && setError("진단 목록을 불러오지 못했습니다."));
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function start() {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const id = await createAssessment(user.uid);
      router.push(`/diagnose/${id}/address`);
    } catch {
      setError("진단을 시작하지 못했습니다. 잠시 뒤 다시 시도해 주세요.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">빈집 진단</h1>
        <p className="text-base text-ink-2">
          주소, 사진, 체크리스트로 공정별 공사비와 운영 수익을 추정합니다.
          단계마다 저장되니 중간에 나가도 이어서 할 수 있어요.
        </p>
      </div>
      <div>
        <button
          type="button"
          onClick={start}
          disabled={busy}
          className={btnPrimary}
        >
          {busy ? "시작하는 중…" : "새 진단 시작하기"}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-base text-crit">
          {error}
        </p>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">내 진단</h2>
        {!list ? (
          <p className="text-base">불러오는 중…</p>
        ) : list.length === 0 ? (
          <p className="text-base text-muted">아직 진단이 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {list.map((a) => (
              <li key={a.id} className={card}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-base font-semibold">
                      {a.address ?? "주소 입력 전"}
                    </span>
                    <span className="text-sm text-muted">
                      {STEP_LABEL[a.reached]} 단계까지 진행 ·{" "}
                      {a.updatedAt?.toLocaleDateString("ko-KR") ?? "–"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/diagnose/${a.id}/${a.reached}`}
                      className={btnLine}
                    >
                      이어서 하기
                    </Link>
                    {canDeleteAssessment(a) && confirming !== a.id && (
                      <button
                        type="button"
                        onClick={() => setConfirming(a.id)}
                        className={`${btnLine} text-crit`}
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>
                {confirming === a.id && (
                  <div
                    role="alert"
                    className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-crit-soft p-3"
                  >
                    <span className="text-base">
                      이 진단과 올린 사진을 모두 지울까요? 되돌릴 수 없습니다.
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => remove(a)}
                        disabled={deleting === a.id}
                        className="inline-flex h-12 items-center rounded-lg bg-crit px-4 text-base text-white disabled:opacity-60"
                      >
                        {deleting === a.id ? "지우는 중…" : "삭제하기"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirming(null)}
                        disabled={deleting === a.id}
                        className={btnLine}
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
