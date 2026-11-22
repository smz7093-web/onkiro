"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { RISK_FLAG_LABELS } from "@/lib/engine/checklist";
import {
  PROCESS_IDS,
  PROCESS_LABELS,
  type AssumptionSet,
  type ConditionGrade,
  type PriceTable,
  type ProcessId,
} from "@/lib/engine/types";
import { listPhotos, photoUrl } from "@/lib/diagnosis/photo-store";
import { PHOTO_PARTS } from "@/lib/diagnosis/photos";
import { diagnosisCode } from "@/lib/diagnosis/store";
import { can } from "@/lib/permissions";
import {
  applyReview,
  type ProcessEdit,
  type ReviewEdits,
} from "@/lib/review/apply";
import {
  loadReviewContext,
  loadVersionsOf,
  REVIEW_STATE_LABEL,
  reviewState,
  submitReview,
  type ReviewContext,
} from "@/lib/review/store";
import { Button, Card, Notice, Pill, buttonClass } from "@/components/ui";
import { dateTime, man } from "./format";
import { NumberInput } from "./number-input";
import { useStaff } from "./staff-context";

const GRADE_LABEL: Record<ConditionGrade, string> = {
  good: "양호",
  partial: "부분 보수",
  full: "전면 교체",
};
const GRADES: ConditionGrade[] = ["good", "partial", "full"];
const partLabel = (id: string) =>
  PHOTO_PARTS.find((p) => p.id === id)?.label ?? id;
const errText = (e: unknown) => (e instanceof Error ? e.message : String(e));

// 진단 검수 상세 (ADM-03, task.md 11.4, 목업 adm-review — 사진 AI 참고값 영역은 넣지 않음).
// 공정별 판정을 바꾸면 단가 DB(스냅샷 당시 버전)로 다시 계산하고, 금액을 직접 고칠 수도 있다. 보정 사유 필수.
export function ReviewDetail({ assessmentId }: { assessmentId: string }) {
  const { permissions } = useStaff();
  const allowed = can(permissions, "canReviewDiagnosis");
  const [ctx, setCtx] = useState<ReviewContext | null>(null);
  const [versions, setVersions] = useState<{
    price: PriceTable;
    assumption: AssumptionSet;
  } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [edits, setEdits] = useState<ReviewEdits>({});
  const [added, setAdded] = useState<ProcessId[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    loadReviewContext(assessmentId)
      .then(async (c) => {
        if (cancelled) return;
        if (!c) {
          setLoadError("견적이 나온 진단을 찾을 수 없습니다.");
          return;
        }
        const v = await loadVersionsOf(c.snapshot);
        if (cancelled) return;
        setCtx(c);
        setVersions(v);
      })
      .catch((e) => !cancelled && setLoadError(errText(e)));
    return () => {
      cancelled = true;
    };
  }, [allowed, assessmentId, reload]);

  const base = ctx?.snapshot;
  const compute = (e: ReviewEdits) => {
    if (!base || !versions) return null;
    try {
      return applyReview(
        { estimateInput: base.inputs.estimateInput, estimate: base.estimate },
        base.inputs.revenueInput,
        versions.price,
        versions.assumption,
        e,
      );
    } catch {
      return null;
    }
  };
  const result = useMemo(
    () => compute(edits),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [base, versions, edits],
  );
  // 판정만 바꾼 계산 (보정 금액 칸의 기본값)
  const regraded = useMemo(() => {
    const gradesOnly: ReviewEdits = {};
    for (const [id, e] of Object.entries(edits) as [ProcessId, ProcessEdit][])
      if (e?.grade) gradesOnly[id] = { grade: e.grade };
    return compute(gradesOnly)?.estimate ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, versions, edits]);

  if (!allowed)
    return (
      <p role="alert" className="text-base">
        진단 검수는 &lsquo;진단 보정&rsquo; 권한이 있는 담당자만 할 수 있습니다.
      </p>
    );
  if (loadError)
    return (
      <div className="flex flex-col gap-3">
        <Link href="/admin/reviews" className="text-base underline">
          ← 진단 검수 목록
        </Link>
        <p role="alert" className="text-base">
          {loadError}
        </p>
      </div>
    );
  if (!ctx || !base || !versions)
    return <p className="text-base">불러오는 중…</p>;

  const a = ctx.assessment;
  const st = reviewState(a);
  const ei = base.inputs.estimateInput;
  const autoCost = new Map(base.estimate.processes.map((p) => [p.id, p.cost]));
  const shown: ProcessId[] = PROCESS_IDS.filter(
    (id) =>
      autoCost.has(id) ||
      added.includes(id) ||
      (ei.conditions[id] !== undefined && ei.conditions[id] !== "good"),
  );
  const addable = PROCESS_IDS.filter((id) => !shown.includes(id));
  const gradeOf = (id: ProcessId): ConditionGrade =>
    edits[id]?.grade ?? ei.conditions[id] ?? "good";
  const changes = result?.changes ?? [];

  function setEdit(id: ProcessId, patch: ProcessEdit) {
    setDone(null);
    setEdits((prev) => {
      const cur: ProcessEdit = { ...prev[id], ...patch };
      if (cur.grade === (ei.conditions[id] ?? "good")) delete cur.grade;
      if (cur.cost === undefined) delete cur.cost;
      const next = { ...prev };
      if (Object.keys(cur).length === 0) delete next[id];
      else next[id] = cur;
      return next;
    });
  }

  async function save(action: "correct" | "confirm") {
    if (!base) return;
    setError(null);
    setBusy(true);
    try {
      if (action === "confirm") {
        await submitReview({
          action,
          assessmentId,
          baseSnapshotId: base.id,
          note: note.trim(),
        });
        setDone("자동 견적 그대로 확인했습니다.");
      } else {
        if (!result) throw new Error("보정 견적을 계산하지 못했습니다");
        await submitReview({
          action,
          assessmentId,
          baseSnapshotId: base.id,
          note: note.trim(),
          conditions: result.estimateInput.conditions as Record<string, string>,
          estimate: result.estimate,
          scenarios: result.scenarios,
          changes: result.changes,
        });
        setDone(
          `보정 견적 ${man(result.estimate.total)}을 저장했습니다. 원래 자동 견적은 그대로 남습니다.`,
        );
      }
      setEdits({});
      setAdded([]);
      setNote("");
      setReload((n) => n + 1);
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/reviews" className="text-base underline">
        ← 진단 검수 목록
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">
            <span className="font-mono">{diagnosisCode(a.id)}</span> ·{" "}
            {a.address ?? "주소 입력 전"}
          </h1>
          <span className="text-sm text-ink-2">
            견적 {dateTime(base.createdAt)} · 단가 {base.inputs.priceVersion} ·
            가정값 {base.inputs.assumptionVersion} · 연면적 {ei.floorArea}㎡ ·
            욕실 {ei.bathrooms} · 주방 {ei.kitchens} · 실내 모듈 {ei.module} ·
            사진 누락 {ei.missingPhotoParts}부위
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Pill tone={st === "pending" || st === "stale" ? "warn" : "good"}>
            {REVIEW_STATE_LABEL[st]}
          </Pill>
          {a.status === "consult" && <Pill tone="accent">상담 연결</Pill>}
          {a.status === "expertRequired" && (
            <Pill tone="crit">전문가 확인 필요</Pill>
          )}
        </div>
      </div>

      {a.review && (
        <Notice tone={st === "stale" ? "warn" : "info"}>
          {dateTime(a.review.reviewedAt)}{" "}
          {a.review.status === "corrected"
            ? `보정 완료 (${a.review.summary ? man(a.review.summary.total) : ""})`
            : "자동 견적 그대로 확인"}
          {a.review.note && ` · 사유: ${a.review.note}`}
          {st === "stale" &&
            " — 그 뒤 회원이 진단을 고쳐 새 자동 견적이 나왔습니다. 아래는 새 견적 기준입니다."}
          {a.review.snapshotId && (
            <>
              {" "}
              <Link
                href={`/report/${a.id}/${a.review.snapshotId}`}
                className="underline"
              >
                보정 리포트 보기
              </Link>
            </>
          )}
        </Notice>
      )}

      {base.checklistResult.riskFlags.length > 0 && (
        <Notice tone="crit">
          위험 신호:{" "}
          {base.checklistResult.riskFlags
            .map((f) => RISK_FLAG_LABELS[f.id])
            .join(", ")}
        </Notice>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <ReviewPhotos assessmentId={a.id} />

        <div className="flex flex-col gap-4">
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead>
                <tr className="border-b border-line text-left text-sm text-ink-2">
                  <th className="py-2">공정</th>
                  <th>판정</th>
                  <th className="text-right">자동</th>
                  <th className="text-right">보정 (원)</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((id) => {
                  const changed = changes.some((c) => c.process === id);
                  const recalculated =
                    regraded?.processes.find((p) => p.id === id)?.cost ?? 0;
                  return (
                    <tr
                      key={id}
                      className={`border-b border-line ${changed ? "bg-accent-soft" : ""}`}
                    >
                      <td className="py-2">{PROCESS_LABELS[id]}</td>
                      <td>
                        <select
                          aria-label={`${PROCESS_LABELS[id]} 판정`}
                          value={gradeOf(id)}
                          onChange={(e) =>
                            setEdit(id, {
                              grade: e.target.value as ConditionGrade,
                            })
                          }
                          className="h-10 rounded-md border border-line-2 bg-surface px-2"
                        >
                          {GRADES.map((g) => (
                            <option key={g} value={g}>
                              {GRADE_LABEL[g]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="text-right">
                        {man(autoCost.get(id) ?? 0)}
                      </td>
                      <td className="text-right">
                        <NumberInput
                          aria-label={`${PROCESS_LABELS[id]} 보정 금액`}
                          value={edits[id]?.cost}
                          placeholder={Math.round(recalculated).toLocaleString(
                            "ko-KR",
                          )}
                          onChange={(v) => setEdit(id, { cost: v })}
                          className="h-10 w-36 rounded-md border border-line-2 bg-surface px-2 text-right"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {addable.length > 0 && (
            <label className="flex flex-wrap items-center gap-2 text-sm">
              공정 추가
              <select
                value=""
                onChange={(e) =>
                  e.target.value &&
                  setAdded((l) => [...l, e.target.value as ProcessId])
                }
                className="h-10 rounded-md border border-line-2 bg-surface px-2"
              >
                <option value="">고르기…</option>
                {addable.map((id) => (
                  <option key={id} value={id}>
                    {PROCESS_LABELS[id]}
                  </option>
                ))}
              </select>
            </label>
          )}
          <p className="text-sm text-ink-2">
            판정을 바꾸면 단가 DB({base.inputs.priceVersion})로 다시 계산합니다.
            금액 칸을 비워 두면 계산값 그대로이고, &lsquo;380만&rsquo;처럼
            적어도 됩니다(지역계수 적용 뒤 최종 금액). 예비비·범위·3안 수익은
            자동으로 다시 계산합니다.
          </p>

          {result && (
            <Card variant="flat">
              <dl className="grid grid-cols-[8rem_1fr] gap-y-1 text-base">
                <dt className="text-ink-2">자동 견적</dt>
                <dd>
                  {man(base.estimate.total)} ({man(base.estimate.rangeLow)}~
                  {man(base.estimate.rangeHigh)})
                </dd>
                <dt className="text-ink-2">보정 견적</dt>
                <dd className={changes.length ? "font-semibold" : ""}>
                  {man(result.estimate.total)} ({man(result.estimate.rangeLow)}~
                  {man(result.estimate.rangeHigh)}) · 공기{" "}
                  {result.estimate.days}일
                </dd>
                <dt className="text-ink-2">월 추정액(기본안)</dt>
                <dd>
                  {man(base.scenarios.base.net)} →{" "}
                  {man(result.scenarios.base.net)}
                </dd>
              </dl>
            </Card>
          )}

          <label className="flex flex-col gap-1 text-base">
            보정 사유 (보정할 때 필수 · 회원 리포트에도 보입니다)
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="예: 균열 사진 없음. 1978년 목구조 → 현장 확인 전 보강 범위 상향"
              className="rounded-lg border border-line-2 bg-surface p-3"
            />
          </label>
          {error && (
            <Notice tone="crit" role="alert">
              {error}
            </Notice>
          )}
          {done && (
            <Notice tone="info" role="status">
              {done}
            </Notice>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              onClick={() => save("correct")}
              disabled={busy || changes.length === 0 || note.trim().length < 2}
            >
              {busy ? "저장 중…" : `보정 저장 (${changes.length}개 공정)`}
            </Button>
            <Button
              onClick={() => save("confirm")}
              disabled={busy || changes.length > 0}
            >
              자동 견적 그대로 확인
            </Button>
            <Link href={`/report/${a.id}/${base.id}`} className={buttonClass()}>
              자동 견적 리포트
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// 진단 사진. 사진 보기 권한(photoAccess)이 없으면 보안 규칙이 막는다
function ReviewPhotos({ assessmentId }: { assessmentId: string }) {
  const [photos, setPhotos] = useState<
    { id: string; part: string; url: string }[] | null
  >(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listPhotos(assessmentId)
      .then((list) =>
        Promise.all(
          list.map(async (p) => ({
            id: p.id,
            part: p.part,
            url: await photoUrl(p.storagePath),
          })),
        ),
      )
      .then((l) => !cancelled && setPhotos(l))
      .catch(() => !cancelled && setDenied(true));
    return () => {
      cancelled = true;
    };
  }, [assessmentId]);

  if (denied)
    return (
      <p className="text-base text-ink-2">
        사진을 볼 권한이 없습니다(회원·권한의 &lsquo;사진 보기&rsquo;).
      </p>
    );
  if (!photos) return <p className="text-base">사진 불러오는 중…</p>;
  if (photos.length === 0)
    return <p className="text-base text-ink-2">올린 사진이 없습니다.</p>;
  return (
    <div className="grid grid-cols-2 gap-2 self-start">
      {photos.map((p) => (
        <a
          key={p.id}
          href={p.url}
          target="_blank"
          rel="noreferrer"
          className="relative block overflow-hidden rounded-md border border-line"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.url}
            alt={partLabel(p.part)}
            className="aspect-[4/3] w-full object-cover"
          />
          <span className="absolute left-1 top-1 rounded bg-ink/70 px-1 text-xs text-white">
            {partLabel(p.part)}
          </span>
        </a>
      ))}
    </div>
  );
}
