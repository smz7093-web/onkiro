"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  deletePhotosByRequest,
  inspectPhotos,
  listExpiredPhotos,
  listPhotoLogs,
  type ExpiredPhotoItem,
  type PhotoInfo,
  type PhotoLog,
} from "@/lib/admin/photo-requests";
import { diagnosisCode } from "@/lib/diagnosis/store";
import { Button, Card, Notice } from "@/components/ui";
import { dateTime } from "./format";
import { useStaff } from "./staff-context";

const isExpired = (i: PhotoInfo) =>
  i.retention?.kind === "expires" &&
  new Date(i.retention.at).getTime() <= Date.now();

const errText = (e: unknown) => (e instanceof Error ? e.message : String(e));

// 사진 삭제 요청 처리 (task.md 11.2, 처리방침: 삭제 요청 10일 내 처리). 관리자만.
// 진단 코드로 찾아 사진만 지운다(진단·견적은 남김). 처리 사유와 함께 기록을 남긴다.
// 11/22부터 보관 기한이 지난 사진도 자동으로 지우지 않고 여기 목록에 올린다 → 관리자가 확인 후 지운다.
export function PhotoRequestAdmin() {
  const { permissions } = useStaff();
  const [code, setCode] = useState("");
  const [info, setInfo] = useState<PhotoInfo | null>(null);
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [logs, setLogs] = useState<PhotoLog[] | null>(null);
  const [reload, setReload] = useState(0);
  const [expired, setExpired] = useState<ExpiredPhotoItem[] | null>(null);
  const isAdmin = permissions.role === "admin";

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    listPhotoLogs()
      .then((l) => !cancelled && setLogs(l))
      .catch(() => !cancelled && setLogs([]));
    listExpiredPhotos()
      .then((l) => !cancelled && setExpired(l))
      .catch(() => !cancelled && setExpired([]));
    return () => {
      cancelled = true;
    };
  }, [isAdmin, reload]);

  if (!isAdmin)
    return (
      <p role="alert" className="text-base">
        사진 삭제 요청 처리는 관리자만 할 수 있습니다.
      </p>
    );

  async function find(e: FormEvent) {
    e.preventDefault();
    await load(code);
  }

  // 목록의 '확인'은 진단 id로 바로 찾고, 처리 사유를 미리 채운다 (회원이 다시 열었으면 기한이 늘어 삭제 대상이 아님)
  async function pick(item: ExpiredPhotoItem) {
    setCode(diagnosisCode(item.assessmentId));
    const r = await load(item.assessmentId);
    if (r && isExpired(r)) setReason("보관 기한 경과");
  }

  async function load(target: string): Promise<PhotoInfo | null> {
    setError(null);
    setDone(null);
    setInfo(null);
    setConfirming(false);
    setReason("");
    setBusy(true);
    try {
      const r = await inspectPhotos(target);
      setInfo(r);
      return r;
    } catch (e) {
      setError(errText(e));
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!info) return;
    setError(null);
    setBusy(true);
    try {
      const r = await deletePhotosByRequest(info.assessmentId, reason);
      setInfo(r);
      setDone(
        `${diagnosisCode(r.assessmentId)} 사진 ${r.deleted}장을 지웠습니다. 처리 기록을 남겼습니다.`,
      );
      setConfirming(false);
      setReason("");
      setReload((n) => n + 1);
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">사진 삭제 요청</h1>
      <p className="text-sm text-ink-2">
        회원이 진단 사진 삭제를 요청하면(전화·의견 보내기 등) 10일 안에
        처리합니다. 진단 코드(마이페이지·리포트의 DX-로 시작하는 번호)로 찾아
        사진만 지웁니다. 진단 결과·견적은 남습니다. 보관 기간(상담 미신청 시
        마지막 이용 후 1년)이 지난 사진은 매일 새벽 4시에 점검해 아래 목록에
        올립니다. 자동으로 지우지 않으니 확인 후 지워 주세요.
      </p>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">보관 기한이 지난 사진</h2>
        {!expired ? (
          <p className="text-base">불러오는 중…</p>
        ) : expired.length === 0 ? (
          <p className="text-base text-ink-2">
            지울 사진이 없습니다. (매일 새벽 4시 점검)
          </p>
        ) : (
          <ul className="flex flex-col">
            {expired.map((x) => (
              <li
                key={x.assessmentId}
                className="flex min-h-12 flex-wrap items-center gap-2 border-b border-line py-1 text-base"
              >
                <span className="font-mono text-sm">
                  {diagnosisCode(x.assessmentId)}
                </span>
                <span className="flex-1">{x.address ?? "주소 입력 전"}</span>
                <span className="text-sm text-crit">
                  {x.expiredAt
                    ? `${x.expiredAt.toLocaleDateString("ko-KR")} 기한 지남`
                    : "기한 지남"}
                </span>
                <Button onClick={() => pick(x)} disabled={busy}>
                  확인
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form onSubmit={find} className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-base">
          진단 코드
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="DX-XXXXXXXX"
            className="h-12 w-56 rounded-lg border border-line-2 bg-surface px-3 font-mono"
          />
        </label>
        <Button type="submit" disabled={busy || code.trim().length < 8}>
          찾기
        </Button>
      </form>

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

      {info && (
        <Card className="max-w-xl">
          <div className="flex flex-col gap-1 text-base">
            <span className="font-mono text-sm text-ink-2">
              {diagnosisCode(info.assessmentId)}
            </span>
            <span className="font-semibold">
              {info.address ?? "주소 입력 전"}
            </span>
            <span>
              사진 {info.photos}장
              {info.photos > 0 &&
                info.retention &&
                ` · ${
                  info.retention.kind === "consult"
                    ? "상담 신청 진단이라 보관"
                    : isExpired(info)
                      ? `${new Date(info.retention.at).toLocaleDateString("ko-KR")} 보관 기한 지남 — 삭제 대상`
                      : `${new Date(info.retention.at).toLocaleDateString("ko-KR")}까지 보관`
                }`}
            </span>
            {info.purgedAt && (
              <span className="text-sm text-ink-2">
                마지막 사진 삭제 {dateTime(new Date(info.purgedAt))}
              </span>
            )}
          </div>
          {info.photos > 0 &&
            (!confirming ? (
              <Button
                variant="danger"
                onClick={() => setConfirming(true)}
                className="self-start"
              >
                사진 삭제…
              </Button>
            ) : (
              <div className="flex flex-col gap-2">
                <label className="flex flex-col gap-1 text-base">
                  처리 사유 (기록에 남습니다)
                  <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="예: 회원 전화 요청 11/20"
                    maxLength={500}
                    className="h-12 rounded-lg border border-line-2 bg-surface px-3"
                  />
                </label>
                <p className="text-sm text-crit">
                  사진 {info.photos}장과 AI 가상 이미지·사진 분석 결과가
                  지워지고 되돌릴 수 없습니다.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="danger"
                    onClick={remove}
                    disabled={busy || reason.trim().length < 2}
                  >
                    {busy ? "지우는 중…" : "사진 삭제 확인"}
                  </Button>
                  <Button onClick={() => setConfirming(false)}>취소</Button>
                </div>
              </div>
            ))}
        </Card>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">최근 처리 기록</h2>
        {!logs ? (
          <p className="text-base">불러오는 중…</p>
        ) : logs.length === 0 ? (
          <p className="text-base text-ink-2">아직 기록이 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {logs.map((l) => (
              <li key={l.id} className="border-b border-line py-1">
                {l.at ? dateTime(l.at) : ""} ·{" "}
                {diagnosisCode(l.path.split("/").at(-1) ?? "")} · 사진{" "}
                {l.photos}장 ·{" "}
                {l.action === "purgeExpiredPhotos"
                  ? "보관 기간 만료 자동 삭제(11/22 전)"
                  : `요청 처리: ${l.reason ?? ""}`}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
