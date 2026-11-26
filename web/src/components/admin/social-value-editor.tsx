"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { can } from "@/lib/permissions";
import {
  DEFAULT_SOCIAL_VALUE,
  SOCIAL_LIMITS,
  validateSocialValue,
  type SocialValue,
} from "@/lib/site-content/social-value";
import {
  forgetSiteContent,
  loadSocialValue,
  saveSocialValue,
  type Edited,
} from "@/lib/site-content/store";
import { SocialValueView } from "../social-value-view";
import { Button, Card, Notice } from "../ui";
import { SavedBy } from "./saved-by";
import { useStaff } from "./staff-context";

const field =
  "h-12 w-full rounded-md border border-line-2 bg-surface px-3 text-base text-ink";
const area =
  "min-h-28 w-full rounded-md border border-line-2 bg-surface px-3 py-2 text-base text-ink";

export const canEditSocialValue = (p: Parameters<typeof can>[0]): boolean =>
  can(p, "canEditAssumptions") || can(p, "canEditContent");

// '사회적 가치' 페이지 편집 (11/26, 예비사회적기업 지정). 켜면 머리말 메뉴·홈 소개 칸·/social-value가 보인다
export function SocialValueEditor() {
  const { user, name, permissions } = useStaff();
  const allowed = canEditSocialValue(permissions);
  const [loaded, setLoaded] = useState<Edited<SocialValue> | null>(null);
  const [draft, setDraft] = useState<SocialValue | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    loadSocialValue().then(
      (r) => {
        if (cancelled) return;
        setLoaded(r);
        setDraft(structuredClone(r.value));
      },
      () => !cancelled && setMessage("불러오지 못했습니다."),
    );
    return () => {
      cancelled = true;
    };
  }, [allowed]);

  if (!allowed)
    return <p className="text-base">이 화면을 고칠 권한이 없습니다.</p>;
  if (!draft) return <p className="text-base">{message ?? "불러오는 중…"}</p>;

  const setItem = (n: number, key: "title" | "body", v: string) =>
    setDraft({
      ...draft,
      items: draft.items.map((i, k) => (k === n ? { ...i, [key]: v } : i)),
    });

  async function save() {
    const cleaned: SocialValue = {
      enabled: draft!.enabled,
      designation: draft!.designation.trim(),
      mission: draft!.mission.trim(),
      items: draft!.items
        .map((i) => ({ title: i.title.trim(), body: i.body.trim() }))
        .filter((i) => i.title || i.body),
    };
    const errs = validateSocialValue(cleaned);
    setErrors(errs);
    setMessage(null);
    if (errs.length) return;
    setBusy(true);
    try {
      await saveSocialValue(cleaned, user, name);
      forgetSiteContent();
      setDraft(cleaned);
      setLoaded({ value: cleaned, updatedByName: name, updatedAt: new Date() });
      setMessage(
        cleaned.enabled
          ? "저장했습니다. 머리말 메뉴·홈·사회적 가치 페이지에 바로 반영됩니다."
          : "저장했습니다. '사이트에 보이기'가 꺼져 있어 아직 공개되지 않습니다.",
      );
    } catch {
      setMessage("저장하지 못했습니다. 권한을 확인해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">사회적 가치</h1>
        <p className="text-base text-ink-2">
          (주)온기로의 미션과 공익 사업을 소개하는 공개 페이지(
          <Link href="/social-value" className="underline">
            /social-value
          </Link>
          )입니다. &lsquo;사이트에 보이기&rsquo;를 켜면 머리말 메뉴와 홈 소개
          칸이 함께 나타납니다.
        </p>
        <SavedBy edited={loaded} />
      </div>

      {!loaded?.updatedAt && (
        <Notice tone="warn" title="기본 문구는 초안입니다">
          지금 보이는 문구는 기존 홈·서비스 소개로 만든 초안입니다. 지정
          유형·지정 기관, 일자리·지역 연계 같은 실제 활동과 실적을 확인해 고친
          뒤 켜 주세요. 예비사회적기업은 &lsquo;사회적기업 인증&rsquo;과 다르니
          인증 마크나 &lsquo;인증&rsquo; 표현은 쓰지 않습니다.
        </Notice>
      )}

      <Card>
        <div className="flex flex-col gap-4">
          <label className="flex min-h-12 items-center gap-3 text-base">
            <input
              type="checkbox"
              className="h-5 w-5"
              checked={draft.enabled}
              onChange={(e) =>
                setDraft({ ...draft, enabled: e.target.checked })
              }
            />
            사이트에 보이기 (머리말 메뉴·홈 소개 칸·페이지)
          </label>
          <label className="flex flex-col gap-1">
            <b className="text-base">
              지정 안내 (한 줄 · 예: 지정일, 유형, 지정 기관)
            </b>
            <input
              className={field}
              value={draft.designation}
              maxLength={SOCIAL_LIMITS.designation}
              onChange={(e) =>
                setDraft({ ...draft, designation: e.target.value })
              }
            />
          </label>
          <label className="flex flex-col gap-1">
            <b className="text-base">
              미션 (첫 문장은 홈 소개 칸에도 보입니다)
            </b>
            <textarea
              className={area}
              value={draft.mission}
              maxLength={SOCIAL_LIMITS.mission}
              onChange={(e) => setDraft({ ...draft, mission: e.target.value })}
            />
            <span className="text-sm text-ink-2">
              {draft.mission.length} / {SOCIAL_LIMITS.mission}자
            </span>
          </label>
          <b className="text-base">공익 사업 소개</b>
          <ol className="flex flex-col gap-4">
            {draft.items.map((i, n) => (
              <li
                key={n}
                className="flex flex-col gap-2 border-t border-line pt-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <b className="text-base">{n + 1}번 사업</b>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        items: draft.items.filter((_, k) => k !== n),
                      })
                    }
                  >
                    삭제
                  </Button>
                </div>
                <input
                  className={field}
                  aria-label={`${n + 1}번 사업 제목`}
                  value={i.title}
                  maxLength={SOCIAL_LIMITS.itemTitle}
                  onChange={(e) => setItem(n, "title", e.target.value)}
                />
                <textarea
                  className={area}
                  aria-label={`${n + 1}번 사업 내용`}
                  value={i.body}
                  maxLength={SOCIAL_LIMITS.itemBody}
                  onChange={(e) => setItem(n, "body", e.target.value)}
                />
                <span className="text-sm text-ink-2">
                  {i.body.length} / {SOCIAL_LIMITS.itemBody}자
                </span>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={draft.items.length >= SOCIAL_LIMITS.items}
              onClick={() =>
                setDraft({
                  ...draft,
                  items: [...draft.items, { title: "", body: "" }],
                })
              }
            >
              + 사업 추가
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                setDraft({
                  ...structuredClone(DEFAULT_SOCIAL_VALUE),
                  enabled: draft.enabled,
                })
              }
            >
              초안 문구로 되돌리기
            </Button>
          </div>
        </div>
      </Card>

      {errors.length > 0 && (
        <Notice tone="crit" role="alert" title="저장하기 전에 고쳐 주세요">
          <ul className="list-disc pl-5">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </Notice>
      )}
      {message && <p className="text-base">{message}</p>}
      <div>
        <Button variant="primary" disabled={busy} onClick={save}>
          {busy ? "저장 중…" : "사회적 가치 저장"}
        </Button>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">미리보기 (저장 전 문구)</h2>
        <div className="rounded-lg border border-dashed border-line-2 bg-paper p-6">
          <SocialValueView content={draft} />
        </div>
      </section>
    </div>
  );
}
