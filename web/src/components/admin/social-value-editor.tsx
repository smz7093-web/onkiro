"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { can, type Permissions } from "@/lib/permissions";
import {
  DEFAULT_SOCIAL_VALUE,
  SOCIAL_LIMITS as L,
  validateSocialValue,
  type Activity,
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
  "min-h-24 w-full rounded-md border border-line-2 bg-surface px-3 py-2 text-base text-ink";

export const canEditSocialValue = (p: Permissions): boolean =>
  can(p, "canEditAssumptions") || can(p, "canEditContent");

// 목록 칸 공통: n번 줄 바꾸기·지우기·추가
function replaceAt<T>(list: T[], n: number, v: T) {
  return list.map((x, k) => (k === n ? v : x));
}
function removeAt<T>(list: T[], n: number) {
  return list.filter((_, k) => k !== n);
}

// n번 줄을 위(-1)·아래(+1)로 옮긴다
function moveAt<T>(list: T[], n: number, dir: -1 | 1) {
  const k = n + dir;
  if (k < 0 || k >= list.length) return list;
  const next = [...list];
  [next[n], next[k]] = [next[k], next[n]];
  return next;
}

function Row({
  label,
  onRemove,
  onMove,
  first,
  last,
  children,
}: {
  label: string;
  onRemove: () => void;
  // 순서 바꾸기 (활동 기록)
  onMove?: (dir: -1 | 1) => void;
  first?: boolean;
  last?: boolean;
  children: ReactNode;
}) {
  return (
    <li className="flex flex-col gap-2 border-t border-line pt-4">
      <div className="flex items-center justify-between gap-2">
        <b className="text-base">{label}</b>
        <div className="flex gap-1">
          {onMove && (
            <>
              <Button
                size="sm"
                aria-label={`${label} 위로`}
                disabled={first}
                onClick={() => onMove(-1)}
              >
                ↑ 위로
              </Button>
              <Button
                size="sm"
                aria-label={`${label} 아래로`}
                disabled={last}
                onClick={() => onMove(1)}
              >
                ↓ 아래로
              </Button>
            </>
          )}
          <Button size="sm" variant="danger" onClick={onRemove}>
            삭제
          </Button>
        </div>
      </div>
      {children}
    </li>
  );
}

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

  const d = draft;
  const set = (patch: Partial<SocialValue>) => setDraft({ ...d, ...patch });
  const setActivity = (n: number, patch: Partial<Activity>) =>
    set({
      activities: replaceAt(d.activities, n, { ...d.activities[n], ...patch }),
    });

  async function save() {
    const t = (s: string) => s.trim();
    const cleaned: SocialValue = {
      enabled: d.enabled,
      designation: t(d.designation),
      mission: t(d.mission),
      vision: t(d.vision),
      strategyTitle: t(d.strategyTitle),
      strategy: d.strategy
        .map((s) => ({ tag: t(s.tag), title: t(s.title), body: t(s.body) }))
        .filter((s) => s.tag || s.title || s.body),
      goalsTitle: t(d.goalsTitle),
      goals: d.goals
        .map((g) => ({ value: t(g.value), label: t(g.label) }))
        .filter((g) => g.value || g.label),
      items: d.items
        .map((i) => ({ title: t(i.title), body: t(i.body) }))
        .filter((i) => i.title || i.body),
      activities: d.activities
        .map((a) => ({
          title: t(a.title),
          date: t(a.date),
          body: t(a.body),
          photos: a.photos
            .map((p) => ({ url: t(p.url), caption: t(p.caption) }))
            .filter((p) => p.url || p.caption),
        }))
        .filter((a) => a.title || a.body || a.photos.length),
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
          칸이 함께 나타납니다. 아래 미리보기로 확인한 뒤 저장하세요.
        </p>
        <SavedBy edited={loaded} />
      </div>

      {!loaded?.updatedAt && (
        <Notice tone="warn" title="저장 전 기본 문구입니다">
          미션 선언문·수업 사진·협약식 사진으로 만든 문구입니다. 사실과 맞는지
          확인한 뒤 켜 주세요. 예비사회적기업은 &lsquo;사회적기업 인증&rsquo;과
          다르니 인증 마크나 &lsquo;인증&rsquo; 표현은 쓰지 않습니다.
        </Notice>
      )}

      <Card>
        <div className="flex flex-col gap-4">
          <label className="flex min-h-12 items-center gap-3 text-base">
            <input
              type="checkbox"
              className="h-5 w-5"
              checked={d.enabled}
              onChange={(e) => set({ enabled: e.target.checked })}
            />
            사이트에 보이기 (머리말 메뉴·홈 소개 칸·페이지)
          </label>
          <label className="flex flex-col gap-1">
            <b className="text-base">지정 안내 (한 줄 · 지정일, 유형)</b>
            <input
              className={field}
              value={d.designation}
              maxLength={L.designation}
              onChange={(e) => set({ designation: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1">
            <b className="text-base">
              미션 (홈 소개 칸에도 첫 문장이 보입니다)
            </b>
            <textarea
              className={area}
              value={d.mission}
              maxLength={L.mission}
              onChange={(e) => set({ mission: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1">
            <b className="text-base">비전</b>
            <input
              className={field}
              value={d.vision}
              maxLength={L.vision}
              onChange={(e) => set({ vision: e.target.value })}
            />
          </label>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-3">
          <b className="text-lg">공익 사업</b>
          <ol className="flex flex-col gap-4">
            {d.items.map((i, n) => (
              <Row
                key={n}
                label={`${n + 1}번 사업`}
                onRemove={() => set({ items: removeAt(d.items, n) })}
              >
                <input
                  className={field}
                  aria-label={`${n + 1}번 사업 제목`}
                  value={i.title}
                  maxLength={L.itemTitle}
                  onChange={(e) =>
                    set({
                      items: replaceAt(d.items, n, {
                        ...i,
                        title: e.target.value,
                      }),
                    })
                  }
                />
                <textarea
                  className={area}
                  aria-label={`${n + 1}번 사업 내용`}
                  value={i.body}
                  maxLength={L.itemBody}
                  onChange={(e) =>
                    set({
                      items: replaceAt(d.items, n, {
                        ...i,
                        body: e.target.value,
                      }),
                    })
                  }
                />
              </Row>
            ))}
          </ol>
          <div>
            <Button
              size="sm"
              disabled={d.items.length >= L.items}
              onClick={() =>
                set({ items: [...d.items, { title: "", body: "" }] })
              }
            >
              + 사업 추가
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-3">
          <b className="text-lg">전략</b>
          <input
            className={field}
            aria-label="전략 제목"
            value={d.strategyTitle}
            maxLength={L.sectionTitle}
            onChange={(e) => set({ strategyTitle: e.target.value })}
          />
          <ol className="flex flex-col gap-4">
            {d.strategy.map((s, n) => (
              <Row
                key={n}
                label={`${n + 1}단계`}
                onRemove={() => set({ strategy: removeAt(d.strategy, n) })}
              >
                <div className="grid gap-2 md:grid-cols-[10rem_1fr]">
                  <input
                    className={field}
                    aria-label={`${n + 1}단계 영문 꼬리표`}
                    placeholder="BUILD"
                    value={s.tag}
                    maxLength={L.tag}
                    onChange={(e) =>
                      set({
                        strategy: replaceAt(d.strategy, n, {
                          ...s,
                          tag: e.target.value,
                        }),
                      })
                    }
                  />
                  <input
                    className={field}
                    aria-label={`${n + 1}단계 제목`}
                    value={s.title}
                    maxLength={L.itemTitle}
                    onChange={(e) =>
                      set({
                        strategy: replaceAt(d.strategy, n, {
                          ...s,
                          title: e.target.value,
                        }),
                      })
                    }
                  />
                </div>
                <textarea
                  className={area}
                  aria-label={`${n + 1}단계 설명`}
                  value={s.body}
                  maxLength={L.itemBody}
                  onChange={(e) =>
                    set({
                      strategy: replaceAt(d.strategy, n, {
                        ...s,
                        body: e.target.value,
                      }),
                    })
                  }
                />
              </Row>
            ))}
          </ol>
          <div>
            <Button
              size="sm"
              disabled={d.strategy.length >= L.strategy}
              onClick={() =>
                set({
                  strategy: [...d.strategy, { tag: "", title: "", body: "" }],
                })
              }
            >
              + 단계 추가
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-3">
          <b className="text-lg">
            성과목표 (페이지에 &lsquo;목표이며 실적이 아님&rsquo;이 함께
            보입니다)
          </b>
          <input
            className={field}
            aria-label="성과목표 제목"
            value={d.goalsTitle}
            maxLength={L.sectionTitle}
            onChange={(e) => set({ goalsTitle: e.target.value })}
          />
          <ol className="flex flex-col gap-4">
            {d.goals.map((g, n) => (
              <Row
                key={n}
                label={`목표 ${n + 1}`}
                onRemove={() => set({ goals: removeAt(d.goals, n) })}
              >
                <div className="grid gap-2 md:grid-cols-[10rem_1fr]">
                  <input
                    className={field}
                    aria-label={`목표 ${n + 1} 숫자`}
                    placeholder="50채"
                    value={g.value}
                    maxLength={L.goalValue}
                    onChange={(e) =>
                      set({
                        goals: replaceAt(d.goals, n, {
                          ...g,
                          value: e.target.value,
                        }),
                      })
                    }
                  />
                  <input
                    className={field}
                    aria-label={`목표 ${n + 1} 설명`}
                    placeholder="빈집 재생"
                    value={g.label}
                    maxLength={L.goalLabel}
                    onChange={(e) =>
                      set({
                        goals: replaceAt(d.goals, n, {
                          ...g,
                          label: e.target.value,
                        }),
                      })
                    }
                  />
                </div>
              </Row>
            ))}
          </ol>
          <div>
            <Button
              size="sm"
              disabled={d.goals.length >= L.goals}
              onClick={() =>
                set({ goals: [...d.goals, { value: "", label: "" }] })
              }
            >
              + 목표 추가
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-3">
          <b className="text-lg">
            활동 기록 (교육·협약 등, 사진 4장까지 · 위에 있는 활동이
            페이지에서도 먼저 보입니다)
          </b>
          <p className="text-sm text-ink-2">
            사진 주소는 사이트에 올려 둔 사진(/social/…)이나 https:// 주소를
            넣습니다. 새 사진은 PM에게 파일을 주면 사이트에 올려 드립니다.
          </p>
          <ol className="flex flex-col gap-4">
            {d.activities.map((a, n) => (
              <Row
                key={n}
                label={`${n + 1}번 활동`}
                onRemove={() => set({ activities: removeAt(d.activities, n) })}
                onMove={(dir) =>
                  set({ activities: moveAt(d.activities, n, dir) })
                }
                first={n === 0}
                last={n === d.activities.length - 1}
              >
                <div className="grid gap-2 md:grid-cols-[1fr_12rem]">
                  <input
                    className={field}
                    aria-label={`${n + 1}번 활동 제목`}
                    value={a.title}
                    maxLength={L.itemTitle}
                    onChange={(e) => setActivity(n, { title: e.target.value })}
                  />
                  <input
                    className={field}
                    aria-label={`${n + 1}번 활동 날짜`}
                    placeholder="2026. 11. 24."
                    value={a.date}
                    maxLength={L.date}
                    onChange={(e) => setActivity(n, { date: e.target.value })}
                  />
                </div>
                <textarea
                  className={area}
                  aria-label={`${n + 1}번 활동 내용`}
                  value={a.body}
                  maxLength={L.itemBody}
                  onChange={(e) => setActivity(n, { body: e.target.value })}
                />
                <ul className="flex flex-col gap-2">
                  {a.photos.map((p, k) => (
                    <li
                      key={k}
                      className="grid items-center gap-2 md:grid-cols-[1fr_1fr_auto]"
                    >
                      <input
                        className={field}
                        aria-label={`${n + 1}번 활동 사진 ${k + 1} 주소`}
                        placeholder="/social/파일.jpg"
                        value={p.url}
                        maxLength={L.photoUrl}
                        onChange={(e) =>
                          setActivity(n, {
                            photos: replaceAt(a.photos, k, {
                              ...p,
                              url: e.target.value,
                            }),
                          })
                        }
                      />
                      <input
                        className={field}
                        aria-label={`${n + 1}번 활동 사진 ${k + 1} 설명`}
                        placeholder="사진 설명"
                        value={p.caption}
                        maxLength={L.caption}
                        onChange={(e) =>
                          setActivity(n, {
                            photos: replaceAt(a.photos, k, {
                              ...p,
                              caption: e.target.value,
                            }),
                          })
                        }
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setActivity(n, { photos: removeAt(a.photos, k) })
                        }
                      >
                        사진 빼기
                      </Button>
                    </li>
                  ))}
                </ul>
                <div>
                  <Button
                    size="sm"
                    disabled={a.photos.length >= L.photos}
                    onClick={() =>
                      setActivity(n, {
                        photos: [...a.photos, { url: "", caption: "" }],
                      })
                    }
                  >
                    + 사진 추가
                  </Button>
                </div>
              </Row>
            ))}
          </ol>
          <div>
            <Button
              size="sm"
              disabled={d.activities.length >= L.activities}
              onClick={() =>
                set({
                  activities: [
                    ...d.activities,
                    { title: "", date: "", body: "", photos: [] },
                  ],
                })
              }
            >
              + 활동 추가
            </Button>
          </div>
        </div>
      </Card>

      <div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            setDraft({
              ...structuredClone(DEFAULT_SOCIAL_VALUE),
              enabled: d.enabled,
            })
          }
        >
          기본 문구로 되돌리기
        </Button>
      </div>

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
          <SocialValueView content={d} />
        </div>
      </section>
    </div>
  );
}
