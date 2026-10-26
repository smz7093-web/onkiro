"use client";

import { useEffect, useState } from "react";
import {
  FEEDBACK_LIMITS,
  FEEDBACK_STATUS_LABELS,
  FEEDBACK_STATUSES,
  listFeedback,
  summarize,
  TESTER_LABELS,
  TESTER_TYPES,
  updateFeedback,
  type Feedback,
  type FeedbackStatus,
} from "@/lib/feedback/store";
import { Button, Card, Pill, type PillTone } from "../ui";
import { useStaff } from "./staff-context";

const area =
  "min-h-20 w-full rounded-md border border-line-2 bg-surface px-3 py-2 text-base text-ink";

const STATUS_TONE: Record<FeedbackStatus, PillTone> = {
  new: "info",
  planned: "warn",
  done: "good",
  wontfix: "neutral",
};

const when = (d: Date | null) =>
  d
    ? d.toLocaleString("ko-KR", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

// 사용자 피드백 보기·처리 (10/26). 상태를 '반영 완료'로 바꾸고 무엇을 고쳤는지 메모하면
// 발표·README의 "피드백 → 개선" 기록이 된다.
export function FeedbackBoard() {
  const [list, setList] = useState<Feedback[] | null>(null);
  const [filter, setFilter] = useState<FeedbackStatus | "all">("all");
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listFeedback().then(
      (r) => !cancelled && setList(r),
      () => !cancelled && setError(true),
    );
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="text-base">불러오지 못했습니다.</p>;
  if (!list) return <p className="text-base">불러오는 중…</p>;

  const s = summarize(list);
  const shown = filter === "all" ? list : list.filter((f) => f.status === filter);
  const replace = (f: Feedback) =>
    setList(list.map((x) => (x.id === f.id ? f : x)));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">사용자 피드백</h1>
        <p className="text-base text-ink-2">
          테스트 주소: onkiro.kr/feedback (로그인 없이 보낼 수 있습니다)
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <span className="text-sm text-ink-2">받은 의견</span>
          <span className="text-2xl font-semibold">{s.count}건</span>
          <span className="text-sm text-ink-2">
            {TESTER_TYPES.filter((t) => s.byTester[t] > 0)
              .map((t) => `${TESTER_LABELS[t]} ${s.byTester[t]}`)
              .join(" · ")}
          </span>
        </Card>
        <Card>
          <span className="text-sm text-ink-2">평균 만족도 (5점)</span>
          <span className="text-2xl font-semibold">{s.rating ?? "–"}</span>
          <span className="text-sm text-ink-2">
            결과 신뢰도 {s.trust ?? "–"}
          </span>
        </Card>
        <Card>
          <span className="text-sm text-ink-2">처리</span>
          <span className="text-2xl font-semibold">
            반영 {s.byStatus.done}건
          </span>
          <span className="text-sm text-ink-2">
            새 의견 {s.byStatus.new} · 반영 예정 {s.byStatus.planned} · 보류{" "}
            {s.byStatus.wontfix}
          </span>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", ...FEEDBACK_STATUSES] as const).map((k) => (
          <Button
            key={k}
            size="sm"
            variant={filter === k ? "primary" : "secondary"}
            aria-pressed={filter === k}
            onClick={() => setFilter(k)}
          >
            {k === "all" ? "전체" : FEEDBACK_STATUS_LABELS[k]}
          </Button>
        ))}
      </div>

      {shown.length === 0 && <p className="text-base">의견이 없습니다.</p>}
      <ul className="flex flex-col gap-3">
        {shown.map((f) => (
          <li key={f.id}>
            <FeedbackCard f={f} onSaved={replace} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function FeedbackCard({
  f,
  onSaved,
}: {
  f: Feedback;
  onSaved: (f: Feedback) => void;
}) {
  const { user, name } = useStaff();
  const [status, setStatus] = useState<FeedbackStatus>(f.status);
  const [note, setNote] = useState(f.note ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const dirty = status !== f.status || note !== (f.note ?? "");

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      await updateFeedback(f.id, status, note, user, name);
      onSaved({ ...f, status, note: note.trim() || null, handledByName: name });
      setMessage("저장했습니다.");
    } catch {
      setMessage("저장하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={STATUS_TONE[f.status]}>
          {FEEDBACK_STATUS_LABELS[f.status]}
        </Pill>
        <b className="text-base">만족도 {f.rating}</b>
        <span className="text-base">
          · 신뢰도 {f.trust ?? "결과 안 봄"}
        </span>
        <span className="text-sm text-ink-2">
          {TESTER_LABELS[f.testerType]} · {when(f.createdAt)}
          {f.page && ` · ${f.page}에서`}
          {f.uid ? " · 회원" : " · 비회원"}
        </span>
      </div>
      {f.good && (
        <p className="text-base">
          <span className="text-ink-2">좋았던 점 </span>
          {f.good}
        </p>
      )}
      {f.improve && (
        <p className="text-base">
          <span className="text-ink-2">고칠 점 </span>
          {f.improve}
        </p>
      )}
      <div className="flex flex-col gap-2 border-t border-line pt-3">
        <div className="flex flex-wrap gap-2">
          {FEEDBACK_STATUSES.map((k) => (
            <Button
              key={k}
              size="sm"
              variant={status === k ? "primary" : "secondary"}
              aria-pressed={status === k}
              onClick={() => setStatus(k)}
            >
              {FEEDBACK_STATUS_LABELS[k]}
            </Button>
          ))}
        </div>
        <label className="flex flex-col gap-1 text-sm text-ink-2">
          반영 메모 (무엇을 어떻게 고쳤는지)
          <textarea
            className={area}
            value={note}
            maxLength={FEEDBACK_LIMITS.note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" disabled={busy || !dirty} onClick={save}>
            {busy ? "저장 중…" : "저장"}
          </Button>
          {f.handledByName && !dirty && (
            <span className="text-sm text-ink-2">처리: {f.handledByName}</span>
          )}
          {message && <span className="text-sm">{message}</span>}
        </div>
      </div>
    </Card>
  );
}
