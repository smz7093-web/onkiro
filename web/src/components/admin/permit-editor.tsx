"use client";

import { useEffect, useState } from "react";
import {
  CONDITIONAL_PERMITS,
  DEFAULT_PERMIT_CONTENT,
  PERMIT_DISCLAIMER,
  type PermitContent,
  type PermitText,
} from "@/lib/diagnosis/permits";
import { can } from "@/lib/permissions";
import { LIMITS, validatePermitContent } from "@/lib/site-content/content";
import {
  forgetSiteContent,
  loadPermitContent,
  savePermitContent,
  type Edited,
} from "@/lib/site-content/store";
import { Button, Card, Notice } from "../ui";
import { useStaff } from "./staff-context";
import { SavedBy } from "./saved-by";
import { DTag } from "./d-tag";

const field =
  "h-12 w-full rounded-md border border-line-2 bg-surface px-3 text-base text-ink";
const area =
  "min-h-20 w-full rounded-md border border-line-2 bg-surface px-3 py-2 text-base text-ink";

// 인허가 간이 확인 문구 편집 (D7, 원일). 저장하면 견적 화면·리포트에 바로 반영된다.
// '모든 집' 항목은 추가·삭제·순서 변경, 조건부 항목은 문구만 고친다(조건 판정은 코드).
export function PermitEditor() {
  const { user, name, permissions } = useStaff();
  const allowed =
    can(permissions, "canEditAssumptions") ||
    can(permissions, "canEditContent");
  const [loaded, setLoaded] = useState<Edited<PermitContent> | null>(null);
  const [draft, setDraft] = useState<PermitContent | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    loadPermitContent().then(
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
    return (
      <p role="alert" className="text-base">
        인허가 항목 편집 권한이 없습니다(가정값 또는 콘텐츠 편집 권한 필요).
      </p>
    );
  if (!draft) return <p className="text-base">{message ?? "불러오는 중…"}</p>;

  const setGeneral = (i: number, patch: Partial<PermitText>) =>
    setDraft({
      ...draft,
      general: draft.general.map((g, j) => (j === i ? { ...g, ...patch } : g)),
    });
  const move = (i: number, d: -1 | 1) => {
    const g = [...draft.general];
    [g[i], g[i + d]] = [g[i + d], g[i]];
    setDraft({ ...draft, general: g });
  };
  const setCond = (
    id: keyof PermitContent["conditional"],
    patch: Partial<PermitText>,
  ) =>
    setDraft({
      ...draft,
      conditional: {
        ...draft.conditional,
        [id]: { ...draft.conditional[id], ...patch },
      },
    });

  async function save() {
    const errs = validatePermitContent(draft!);
    setErrors(errs);
    setMessage(null);
    if (errs.length) return;
    setBusy(true);
    try {
      await savePermitContent(draft!, user, name);
      forgetSiteContent();
      setMessage("저장했습니다. 견적 화면과 리포트에 바로 반영됩니다.");
    } catch {
      setMessage("저장하지 못했습니다. 권한을 확인해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">
          인허가 간이 확인 항목 <DTag ids={["D7"]} />
        </h1>
        <p className="text-base text-ink-2">
          견적 화면의 &lsquo;숙박 영업 간이 확인&rsquo;과 리포트에 나오는
          문구입니다. 저장하면 바로 반영됩니다.
        </p>
        <SavedBy edited={loaded} />
        <Notice tone="info">
          모든 항목은 &lsquo;확인 필요&rsquo;로 표시되고, 아래 안내가 늘 함께
          나옵니다. &lsquo;가능합니다&rsquo;처럼 판정하는 표현은 쓰지 않습니다.
          <span className="text-sm text-ink-2">{PERMIT_DISCLAIMER}</span>
        </Notice>
      </div>

      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">모든 집에 보이는 항목</h2>
          <span className="text-sm text-ink-2">
            {draft.general.length} / {LIMITS.generalItems}개 · 위에서부터
            순서대로
          </span>
        </div>
        <ol className="flex flex-col gap-4">
          {draft.general.map((g, i) => (
            <li
              key={g.id}
              className="flex flex-col gap-2 rounded-md bg-surface-2 p-3"
            >
              <TextFields
                label={`${i + 1}번`}
                value={g}
                onChange={(patch) => setGeneral(i, patch)}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                >
                  위로
                </Button>
                <Button
                  size="sm"
                  disabled={i === draft.general.length - 1}
                  onClick={() => move(i, 1)}
                >
                  아래로
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      general: draft.general.filter((_, j) => j !== i),
                    })
                  }
                >
                  빼기
                </Button>
              </div>
            </li>
          ))}
        </ol>
        <div>
          <Button
            disabled={draft.general.length >= LIMITS.generalItems}
            onClick={() =>
              setDraft({
                ...draft,
                general: [
                  ...draft.general,
                  {
                    id: `item${Date.now().toString(36)}`,
                    title: "",
                    nextAction: "",
                    agency: "",
                  },
                ],
              })
            }
          >
            + 항목 추가
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">
          조건에 맞는 집에만 보이는 항목
        </h2>
        <p className="text-sm text-ink-2">
          언제 보일지는 건축물대장·토지 정보로 자동으로 정해집니다. 문구만 고칠
          수 있습니다. 새 조건이 필요하면 PM에게 알려 주세요.
        </p>
        <ul className="flex flex-col gap-4">
          {CONDITIONAL_PERMITS.map((p) => (
            <li
              key={p.id}
              className="flex flex-col gap-2 rounded-md bg-surface-2 p-3"
            >
              <b className="text-base">보이는 때: {p.when}</b>
              {p.placeholder && (
                <span className="text-sm text-ink-2">
                  제목의 {p.placeholder} 자리에 실제 값이 들어갑니다.
                </span>
              )}
              <TextFields
                label={p.when}
                value={draft.conditional[p.id]}
                onChange={(patch) => setCond(p.id, patch)}
              />
            </li>
          ))}
        </ul>
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
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" disabled={busy} onClick={save}>
          {busy ? "저장 중…" : "저장"}
        </Button>
        <Button
          disabled={busy}
          onClick={() => {
            setDraft(structuredClone(DEFAULT_PERMIT_CONTENT));
            setMessage("처음 문구로 되돌렸습니다. 저장해야 반영됩니다.");
          }}
        >
          처음 문구로 되돌리기
        </Button>
      </div>
    </div>
  );
}

function TextFields({
  label,
  value,
  onChange,
}: {
  label: string;
  value: PermitText;
  onChange: (patch: Partial<PermitText>) => void;
}) {
  return (
    <>
      <label className="flex flex-col gap-1 text-sm text-ink-2">
        제목 (화면에 크게 보이는 문장)
        <input
          className={field}
          value={value.title}
          maxLength={LIMITS.title}
          aria-label={`${label} 제목`}
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-ink-2">
        다음 행동 (무엇을 확인·문의하면 되는지)
        <textarea
          className={area}
          value={value.nextAction}
          maxLength={LIMITS.nextAction}
          aria-label={`${label} 다음 행동`}
          onChange={(e) => onChange({ nextAction: e.target.value })}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-ink-2">
        관할 기관 (선택, 예: 홍성군청 ○○과)
        <input
          className={field}
          value={value.agency}
          maxLength={LIMITS.agency}
          aria-label={`${label} 관할 기관`}
          onChange={(e) => onChange({ agency: e.target.value })}
        />
      </label>
    </>
  );
}
