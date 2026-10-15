"use client";

import { useEffect, useState } from "react";
import { PHOTO_PARTS, type PhotoGuides } from "@/lib/diagnosis/photos";
import { can } from "@/lib/permissions";
import { LIMITS, validatePhotoGuides } from "@/lib/site-content/content";
import {
  forgetSiteContent,
  loadPhotoGuides,
  savePhotoGuides,
  type Edited,
} from "@/lib/site-content/store";
import { Button, Card, Notice } from "../ui";
import { SavedBy } from "./saved-by";
import { useStaff } from "./staff-context";
import { DTag } from "./d-tag";

const area =
  "min-h-20 w-full rounded-md border border-line-2 bg-surface px-3 py-2 text-base text-ink";

// 촬영 가이드 편집 (D9, 해순). 진단 사진 단계에서 부위마다 보이는 안내 문구. 비우면 기본 문구가 보인다.
export function PhotoGuideEditor() {
  const { user, name, permissions } = useStaff();
  const allowed = can(permissions, "canEditContent");
  const [loaded, setLoaded] = useState<Edited<PhotoGuides> | null>(null);
  const [draft, setDraft] = useState<PhotoGuides | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    loadPhotoGuides().then(
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
  }, [allowed]);

  if (!allowed)
    return (
      <p role="alert" className="text-base">
        촬영 가이드 편집 권한이 없습니다(콘텐츠 편집 권한 필요).
      </p>
    );
  if (!draft) return <p className="text-base">{message ?? "불러오는 중…"}</p>;

  async function save() {
    const cleaned = Object.fromEntries(
      Object.entries(draft!)
        .map(([k, v]) => [k, (v ?? "").trim()])
        .filter(([, v]) => v),
    ) as PhotoGuides;
    const errs = validatePhotoGuides(cleaned);
    setErrors(errs);
    setMessage(null);
    if (errs.length) return;
    setBusy(true);
    try {
      await savePhotoGuides(cleaned, user, name);
      forgetSiteContent();
      setMessage("저장했습니다. 사진 단계에 바로 반영됩니다.");
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
          촬영 가이드 <DTag ids={["D9"]} />
        </h1>
        <p className="text-base text-ink-2">
          진단 사진 단계에서 부위마다 보이는 안내 문구입니다. 비워 두면 회색
          글씨의 기본 문구가 그대로 보입니다. 저장하면 바로 반영됩니다.
        </p>
        <SavedBy edited={loaded} />
        <Notice tone="info">
          외관 정면 사진은 AI 리모델링 가상 이미지의 원본이 되고, 지붕·벽
          균열·욕실·주방 사진은 AI 사진 분석에 쓰입니다. 사람 얼굴·차량
          번호판·문패가 찍히지 않도록 안내해 주세요.
        </Notice>
      </div>

      <Card>
        <ul className="flex flex-col gap-4">
          {PHOTO_PARTS.map((p) => (
            <li key={p.id}>
              <label className="flex flex-col gap-1">
                <b className="text-base">{p.label}</b>
                <textarea
                  className={area}
                  value={draft[p.id] ?? ""}
                  placeholder={p.guide}
                  maxLength={LIMITS.guide}
                  onChange={(e) =>
                    setDraft({ ...draft, [p.id]: e.target.value })
                  }
                />
                <span className="text-sm text-ink-2">
                  {(draft[p.id] ?? "").length} / {LIMITS.guide}자
                </span>
              </label>
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
      <div>
        <Button variant="primary" disabled={busy} onClick={save}>
          {busy ? "저장 중…" : "저장"}
        </Button>
      </div>
    </div>
  );
}
