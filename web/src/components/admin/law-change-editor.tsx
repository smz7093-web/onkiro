"use client";

import { useEffect, useState } from "react";
import { can } from "@/lib/permissions";
import {
  DEFAULT_LAW_CHANGE,
  LAW_LIMITS,
  validateLawChange,
  type LawChange,
} from "@/lib/site-content/law-change";
import {
  forgetSiteContent,
  loadLawChange,
  saveLawChange,
  type Edited,
} from "@/lib/site-content/store";
import { Button, Card, Notice } from "../ui";
import { useStaff } from "./staff-context";
import { SavedBy } from "./saved-by";

const field =
  "h-12 w-full rounded-md border border-line-2 bg-surface px-3 text-base text-ink";
const area =
  "min-h-24 w-full rounded-md border border-line-2 bg-surface px-3 py-2 text-base text-ink";

// 시행 예정 법 개정 참고 편집 (10/31, PM). 견적 화면 '숙박 영업 간이 확인' 아래 접힌 상자. 인허가 문구와 같은 권한.
export function LawChangeEditor() {
  const { user, name, permissions } = useStaff();
  const allowed =
    can(permissions, "canEditAssumptions") ||
    can(permissions, "canEditContent");
  const [loaded, setLoaded] = useState<Edited<LawChange> | null>(null);
  const [draft, setDraft] = useState<LawChange | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    loadLawChange().then(
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

  if (!allowed) return null;
  if (!draft) return <p className="text-base">{message ?? "불러오는 중…"}</p>;

  const setItem = (n: number, key: "title" | "body", v: string) =>
    setDraft({
      ...draft,
      items: draft.items.map((i, k) => (k === n ? { ...i, [key]: v } : i)),
    });

  async function save() {
    const cleaned: LawChange = {
      enabled: draft!.enabled,
      title: draft!.title.trim(),
      note: draft!.note.trim(),
      items: draft!.items
        .map((i) => ({ title: i.title.trim(), body: i.body.trim() }))
        .filter((i) => i.title || i.body),
    };
    const errs = validateLawChange(cleaned);
    setErrors(errs);
    setMessage(null);
    if (errs.length) return;
    setBusy(true);
    try {
      await saveLawChange(cleaned, user, name);
      forgetSiteContent();
      setDraft(cleaned);
      setMessage("저장했습니다. 견적 화면에 바로 반영됩니다.");
    } catch {
      setMessage("저장하지 못했습니다. 권한을 확인해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">시행 예정 법 개정 (참고)</h2>
        <p className="text-base text-ink-2">
          견적 화면 &lsquo;숙박 영업 간이 확인&rsquo; 아래에 접힌 상자로
          보입니다. 현행 확인 항목과 따로 보여주고, AI 인허가 안내 자료에는
          들어가지 않습니다. 저장한 적이 없으면 기본 요약이 보입니다.
        </p>
        <SavedBy edited={loaded} />
      </div>

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
            견적 화면에 보이기
          </label>
          <label className="flex flex-col gap-1">
            <b className="text-base">제목 (접힌 상태에서 보이는 줄)</b>
            <input
              className={field}
              value={draft.title}
              maxLength={LAW_LIMITS.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1">
            <b className="text-base">
              안내 문구 (공포·시행일, 참고 정보라는 점)
            </b>
            <textarea
              className={area}
              value={draft.note}
              maxLength={LAW_LIMITS.note}
              onChange={(e) => setDraft({ ...draft, note: e.target.value })}
            />
          </label>
          <ol className="flex flex-col gap-4">
            {draft.items.map((i, n) => (
              <li
                key={n}
                className="flex flex-col gap-2 border-t border-line pt-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <b className="text-base">{n + 1}번 항목</b>
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
                  aria-label={`${n + 1}번 항목 제목`}
                  value={i.title}
                  maxLength={LAW_LIMITS.itemTitle}
                  onChange={(e) => setItem(n, "title", e.target.value)}
                />
                <textarea
                  className={area}
                  aria-label={`${n + 1}번 항목 내용`}
                  value={i.body}
                  maxLength={LAW_LIMITS.itemBody}
                  onChange={(e) => setItem(n, "body", e.target.value)}
                />
                <span className="text-sm text-ink-2">
                  {i.body.length} / {LAW_LIMITS.itemBody}자
                </span>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={draft.items.length >= LAW_LIMITS.items}
              onClick={() =>
                setDraft({
                  ...draft,
                  items: [...draft.items, { title: "", body: "" }],
                })
              }
            >
              + 항목 추가
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDraft(structuredClone(DEFAULT_LAW_CHANGE))}
            >
              기본 요약으로 되돌리기
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
          {busy ? "저장 중…" : "법 개정 참고 저장"}
        </Button>
      </div>
    </section>
  );
}
