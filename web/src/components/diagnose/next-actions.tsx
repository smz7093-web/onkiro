"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ensureSnapshot,
  type SnapshotPayload,
  type SnapshotReason,
} from "@/lib/diagnosis/snapshot-store";
import { useDiagnosis } from "./diagnosis-context";
import { btnPrimary, btnSecondary } from "./styles";

type Action = "inspection" | "turnkey" | "pdf" | "save";

const LABEL: Record<Action, string> = {
  inspection: "현장진단 신청",
  turnkey: "턴키 PM 상담",
  pdf: "PDF 받기",
  save: "저장",
};

const REASON: Record<Action, SnapshotReason> = {
  inspection: "consult",
  turnkey: "consult",
  pdf: "pdf",
  save: "save",
};

// 다음 행동 버튼 (SIM-17, task.md 7.5). 누를 때 입력이 마지막 스냅샷과 다르면 새 스냅샷을 만들고(7.4),
// 상담·PDF는 그 스냅샷 id를 넘긴다.
export function NextActions({
  payload,
  actions,
  primary,
}: {
  payload: SnapshotPayload | null;
  actions: Action[];
  primary?: Action;
}) {
  const { assessment, reload } = useDiagnosis();
  const router = useRouter();
  const [busy, setBusy] = useState<Action | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function run(action: Action) {
    if (!payload) return;
    setBusy(action);
    setMessage(null);
    try {
      const before = assessment.latestSnapshotId;
      const sid = await ensureSnapshot(assessment, payload, REASON[action]);
      await reload();
      if (action === "save") {
        setMessage(
          sid === before ? "이미 저장된 내용입니다." : "저장했습니다.",
        );
      } else if (action === "pdf") {
        router.push(`/report/${assessment.id}/${sid}`);
      } else {
        router.push(
          `/consult?assessment=${assessment.id}&type=${action}&snapshot=${sid}`,
        );
      }
    } catch {
      setMessage("저장하지 못했습니다. 잠시 뒤 다시 시도해 주세요.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <button
            key={a}
            type="button"
            className={a === primary ? btnPrimary : btnSecondary}
            disabled={!payload || busy !== null}
            onClick={() => run(a)}
          >
            {busy === a ? "처리 중…" : LABEL[a]}
          </button>
        ))}
      </div>
      {message && (
        <p role="status" className="text-sm text-ink-2">
          {message}
        </p>
      )}
    </div>
  );
}
