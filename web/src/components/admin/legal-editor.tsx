"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LegalText } from "@/components/legal/legal-text";
import { can, type Permissions } from "@/lib/permissions";
import {
  COMPANY_FIELDS,
  COMPANY_MAX,
  DEFAULT_COMPANY,
  DEFAULT_LEGAL,
  EFFECTIVE_DATE_MAX,
  fillPlaceholders,
  LEGAL_BODY_MAX,
  LEGAL_TITLE,
  validateCompany,
  validateLegalDoc,
  type CompanyInfo,
  type LegalDoc,
  type LegalKind,
} from "@/lib/site-content/legal";
import {
  loadCompany,
  loadLegalDoc,
  saveCompany,
  saveLegalDoc,
  type Edited,
} from "@/lib/site-content/store";
import { Button, Card, Notice } from "../ui";
import { SavedBy } from "./saved-by";
import { useStaff } from "./staff-context";

const field =
  "h-12 w-full rounded-md border border-line-2 bg-surface px-3 text-base text-ink";

// 인허가 문구와 같은 권한 (원일 = 가정값 수정, 콘텐츠 담당 = 콘텐츠 수정)
export const canEditLegal = (p: Permissions) =>
  can(p, "canEditAssumptions") || can(p, "canEditContent");

function Errors({ errors }: { errors: string[] }) {
  if (!errors.length) return null;
  return (
    <Notice tone="crit" role="alert" title="저장하기 전에 고쳐 주세요">
      <ul className="list-disc pl-5">
        {errors.map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ul>
    </Notice>
  );
}

// 사업자 정보 (바닥글, 약관 빈칸)
export function CompanyEditor({
  onSaved,
}: {
  onSaved: (c: CompanyInfo) => void;
}) {
  const { user, name, permissions } = useStaff();
  const allowed = canEditLegal(permissions);
  const [loaded, setLoaded] = useState<Edited<CompanyInfo> | null>(null);
  const [draft, setDraft] = useState<CompanyInfo | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    loadCompany().then(
      (r) => {
        if (cancelled) return;
        setLoaded(r);
        setDraft({ ...r.value });
        onSaved(r.value);
      },
      () => !cancelled && setMessage("불러오지 못했습니다."),
    );
    return () => {
      cancelled = true;
    };
  }, [allowed, onSaved]);

  if (!allowed) return null;
  if (!draft) return <p className="text-base">{message ?? "불러오는 중…"}</p>;

  async function save() {
    const cleaned = Object.fromEntries(
      Object.entries(draft!).map(([k, v]) => [k, v.trim()]),
    ) as unknown as CompanyInfo;
    const errs = validateCompany(cleaned);
    setErrors(errs);
    setMessage(null);
    if (errs.length) return;
    setBusy(true);
    try {
      await saveCompany(cleaned, user, name);
      setDraft(cleaned);
      onSaved(cleaned);
      setMessage("저장했습니다. 바닥글과 약관 화면에 바로 반영됩니다.");
    } catch {
      setMessage("저장하지 못했습니다. 권한을 확인해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">사업자 정보</h2>
        <p className="text-base text-ink-2">
          모든 화면 바닥글에 보이고, 약관·처리방침의 <code>{"{운영주체}"}</code>{" "}
          <code>{"{보호책임자}"}</code> 같은 빈칸을 채웁니다. 비워 둔 칸은
          바닥글에서 빠집니다. 사업자 등록·통신판매업 신고를 하면 번호를 채워
          주세요.
        </p>
        <SavedBy edited={loaded} />
      </div>
      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          {COMPANY_FIELDS.map((f) => (
            <label key={f.key} className="flex flex-col gap-1">
              <b className="text-base">{f.label}</b>
              <input
                className={field}
                value={draft[f.key]}
                maxLength={COMPANY_MAX}
                onChange={(e) =>
                  setDraft({ ...draft, [f.key]: e.target.value })
                }
              />
              {f.hint && <span className="text-sm text-ink-2">{f.hint}</span>}
            </label>
          ))}
        </div>
        <div className="pt-4">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDraft({ ...DEFAULT_COMPANY })}
          >
            기본값으로 되돌리기
          </Button>
        </div>
      </Card>
      <Errors errors={errors} />
      {message && <p className="text-base">{message}</p>}
      <div>
        <Button variant="primary" disabled={busy} onClick={save}>
          {busy ? "저장 중…" : "사업자 정보 저장"}
        </Button>
      </div>
    </section>
  );
}

// 이용약관·개인정보 처리방침 본문
export function LegalDocEditor({
  kind,
  company,
}: {
  kind: LegalKind;
  company: CompanyInfo;
}) {
  const { user, name, permissions } = useStaff();
  const allowed = canEditLegal(permissions);
  const [loaded, setLoaded] = useState<Edited<LegalDoc> | null>(null);
  const [draft, setDraft] = useState<LegalDoc | null>(null);
  const [preview, setPreview] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const title = LEGAL_TITLE[kind];

  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    loadLegalDoc(kind).then(
      (r) => {
        if (cancelled) return;
        setLoaded(r);
        setDraft({ ...r.value });
      },
      () => !cancelled && setMessage("불러오지 못했습니다."),
    );
    return () => {
      cancelled = true;
    };
  }, [allowed, kind]);

  if (!allowed) return null;
  if (!draft) return <p className="text-base">{message ?? "불러오는 중…"}</p>;

  async function save() {
    const cleaned: LegalDoc = {
      effectiveDate: draft!.effectiveDate.trim(),
      body: draft!.body.trim(),
    };
    const errs = validateLegalDoc(cleaned);
    setErrors(errs);
    setMessage(null);
    if (errs.length) return;
    setBusy(true);
    try {
      await saveLegalDoc(kind, cleaned, user, name);
      setDraft(cleaned);
      setMessage(`저장했습니다. ${title} 화면에 바로 반영됩니다.`);
    } catch {
      setMessage("저장하지 못했습니다. 권한을 확인해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-base text-ink-2">
          <Link
            href={`/${kind}`}
            target="_blank"
            className="underline underline-offset-4"
          >
            공개 화면 보기 (새 창)
          </Link>
          . 저장한 적이 없으면 D8 확정본(10/20)을 옮긴 기본 문구가 보입니다.
          내용이 크게 바뀌면 동의 버전을 올려 재동의를 받아야 하니 PM에게 알려
          주세요.
        </p>
        <SavedBy edited={loaded} />
      </div>
      <Card>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <b className="text-base">시행일</b>
            <input
              className={`${field} max-w-xs`}
              value={draft.effectiveDate}
              maxLength={EFFECTIVE_DATE_MAX}
              placeholder="예: 2026년 11월 4일"
              onChange={(e) =>
                setDraft({ ...draft, effectiveDate: e.target.value })
              }
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={preview ? "ghost" : "secondary"}
              onClick={() => setPreview(false)}
            >
              고치기
            </Button>
            <Button
              size="sm"
              variant={preview ? "secondary" : "ghost"}
              onClick={() => setPreview(true)}
            >
              미리 보기
            </Button>
          </div>
          {preview ? (
            <div className="rounded-md border border-line p-4">
              <LegalText
                text={fillPlaceholders(
                  draft.body,
                  company,
                  draft.effectiveDate,
                )}
              />
            </div>
          ) : (
            <label className="flex flex-col gap-1">
              <b className="text-base">본문</b>
              <textarea
                className="min-h-[480px] w-full rounded-md border border-line-2 bg-surface px-3 py-2 font-mono text-sm leading-6 text-ink"
                value={draft.body}
                maxLength={LEGAL_BODY_MAX}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              />
              <span className="text-sm text-ink-2">
                쓰는 법: <code># 큰 제목</code> · <code>## 작은 제목</code> ·{" "}
                <code>- 목록</code> · <code>1. 번호 목록</code> ·{" "}
                <code>| 칸 | 칸 |</code> 표(첫 줄이 머리글) ·{" "}
                <code>**굵게**</code> · 빈 줄로 문단 나눔. 빈칸{" "}
                <code>
                  {
                    "{운영주체} {대표자} {보호책임자} {보호책임자연락처} {이메일} {전화} {시행일}"
                  }
                </code>
                은 사업자 정보로 채워집니다. (
                {draft.body.length.toLocaleString()} /{" "}
                {LEGAL_BODY_MAX.toLocaleString()}자)
              </span>
            </label>
          )}
          <div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDraft({ ...DEFAULT_LEGAL[kind] })}
            >
              기본 문구로 되돌리기
            </Button>
          </div>
        </div>
      </Card>
      <Errors errors={errors} />
      {message && <p className="text-base">{message}</p>}
      <div>
        <Button variant="primary" disabled={busy} onClick={save}>
          {busy ? "저장 중…" : `${title} 저장`}
        </Button>
      </div>
    </section>
  );
}
