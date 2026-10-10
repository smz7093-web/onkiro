"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthUser } from "@/lib/auth/use-auth-user";
import { useMemberName } from "@/lib/auth/use-member-name";
import {
  CONSULT_TYPE_LABELS,
  CONSULT_TYPES,
  type ConsultType,
} from "@/lib/consult/status";
import {
  applyConsultation,
  OWNERSHIP_LABELS,
  OWNERSHIPS,
  type Ownership,
} from "@/lib/consult/store";
import {
  diagnosisCode,
  getAssessment,
  type Assessment,
} from "@/lib/diagnosis/store";
import { btnPrimary, card, info, input } from "@/components/diagnose/styles";

const TYPE_HINT: Record<ConsultType, string> = {
  inspection: "전문가가 현장을 방문해 구조·설비를 확인하고 견적을 확정합니다.",
  turnkey: "설계부터 공사·운영 준비까지 한 번에 맡기는 방식을 상담합니다.",
  entrust: "빈집을 온기로에 맡겨 재생·운영하는 위탁 조건을 상담합니다.",
};

// 상담 신청 (CON-01, task.md 9.1). 진단에서 왔으면 진단·스냅샷을 자동으로 연결한다.
export function ConsultApply({
  assessmentId,
  snapshotId,
  initialType,
}: {
  assessmentId: string | null;
  snapshotId: string | null;
  initialType: string | null;
}) {
  const user = useAuthUser();
  const memberName = useMemberName(user);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [type, setType] = useState<ConsultType>(
    CONSULT_TYPES.includes(initialType as ConsultType)
      ? (initialType as ConsultType)
      : "inspection",
  );
  const [name, setName] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [ownership, setOwnership] = useState<Ownership>("self");
  const [preferredDate, setPreferredDate] = useState("");
  const [memo, setMemo] = useState("");
  const [phoneRequested, setPhoneRequested] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<string | null>(null);

  useEffect(() => {
    if (!assessmentId) return;
    let cancelled = false;
    getAssessment(assessmentId)
      .then((a) => !cancelled && setAssessment(a))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [assessmentId]);

  const applicant = name ?? memberName ?? "";
  const phoneOk = /^[0-9-+ ]{8,20}$/.test(phone.trim());

  async function submit() {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const id = await applyConsultation(
        user.uid,
        {
          type,
          applicantName: applicant.trim(),
          phone: phone.trim(),
          ownership,
          preferredDate: preferredDate || null,
          memo: memo.trim(),
          phoneRequested,
        },
        assessment,
        snapshotId,
      );
      setDoneId(id);
    } catch {
      setError("신청하지 못했습니다. 잠시 뒤 다시 시도해 주세요.");
      setBusy(false);
    }
  }

  if (doneId) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">상담 신청이 접수되었습니다</h1>
        <p className="text-base text-ink-2">
          영업일 기준 1일 안에 운영팀이 연락드립니다. 진행 상황은 마이페이지에서
          볼 수 있어요.
        </p>
        <div>
          <Link href="/me" className={btnPrimary}>
            마이페이지로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">상담 신청</h1>

      <fieldset className={card}>
        <legend className="sr-only">상담 유형</legend>
        <span className="text-lg font-semibold">상담 유형</span>
        {CONSULT_TYPES.map((t) => (
          <label key={t} className="flex min-h-12 items-start gap-3 text-base">
            <input
              type="radio"
              name="type"
              className="mt-1 size-5"
              checked={type === t}
              onChange={() => setType(t)}
            />
            <span>
              {CONSULT_TYPE_LABELS[t]}
              <span className="block text-sm text-ink-2">{TYPE_HINT[t]}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {assessment && (
        <p className={info}>
          연결된 진단: {diagnosisCode(assessment.id)} · {assessment.address}
          {snapshotId && " (지금 화면의 견적 결과가 함께 전달됩니다)"}
        </p>
      )}

      <section className={card}>
        <label className="flex flex-col gap-1 text-sm text-ink-2">
          신청인 이름
          <input
            className={input}
            value={applicant}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink-2">
          연락처
          <input
            className={input}
            type="tel"
            inputMode="tel"
            placeholder="010-0000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink-2">
          소유 관계
          <select
            className={input}
            value={ownership}
            onChange={(e) => setOwnership(e.target.value as Ownership)}
          >
            {OWNERSHIPS.map((o) => (
              <option key={o} value={o}>
                {OWNERSHIP_LABELS[o]}
              </option>
            ))}
          </select>
        </label>
        {ownership === "coHeir" && (
          <p className={info}>
            공동상속 주택은 계약 단계에서 다른 상속인의 동의서가 필요합니다.
            지금은 준비하지 않으셔도 됩니다.
          </p>
        )}
        <label className="flex flex-col gap-1 text-sm text-ink-2">
          희망 연락일 (선택)
          <input
            className={input}
            type="date"
            value={preferredDate}
            onChange={(e) => setPreferredDate(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink-2">
          메모 (선택)
          <textarea
            className="min-h-24 w-full rounded-md border border-line-2 bg-surface px-3 py-2 text-base text-ink"
            maxLength={2000}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </label>
        <label className="flex min-h-12 items-center gap-3 text-base">
          <input
            type="checkbox"
            className="size-5"
            checked={phoneRequested}
            onChange={(e) => setPhoneRequested(e.target.checked)}
          />
          전화 상담을 원합니다
        </label>
      </section>

      {error && (
        <p role="alert" className="text-base text-crit">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <button
          type="button"
          className={btnPrimary}
          disabled={busy || !applicant.trim() || !phoneOk || !user}
          onClick={submit}
        >
          {busy ? "신청 중…" : "상담 신청하기"}
        </button>
      </div>
    </div>
  );
}
