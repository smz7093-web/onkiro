"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { can } from "@/lib/permissions";
import { getBranch, saveBranch, uploadBranchPhoto } from "@/lib/branches/store";
import type { BranchContent } from "@/lib/branches/types";
import {
  isBranchId,
  normalizeBranch,
  validateBranch,
  type BranchDraft,
} from "@/lib/branches/validate";
import { useStaff } from "./staff-context";
import { buttonClass } from "../ui";
import { NumberInput } from "./number-input";
import { readBooking, type BookingSettings } from "@/lib/reservations/rules";

const field =
  "h-11 w-full rounded-md border border-line-2 bg-surface px-3 text-base text-ink";
const area =
  "min-h-20 w-full rounded-md border border-line-2 bg-surface px-3 py-2 text-base text-ink";
const btn = buttonClass();
const btnDark = buttonClass({ variant: "primary" });
const small = buttonClass({ variant: "ghost", size: "sm" });

const EMPTY: BranchContent = {
  label: "",
  headline: "",
  summary: "",
  photos: [],
  cleaning: { headline: "", detail: "" },
  amenities: [],
  experiences: [],
  location: "",
  price: { weekday: 0, weekend: 0, checkIn: "15:00", checkOut: "11:00" },
};

// 숙소 콘텐츠 편집 (STY-01·02, task.md 9.3). 저장하면 공개 숙소 화면에 바로 반영된다.
export function BranchEditor({ id }: { id: string }) {
  const { user, name, permissions } = useStaff();
  const allowed = can(permissions, "canEditContent");
  const [draft, setDraft] = useState<BranchDraft | null>(null);
  const [fromSample, setFromSample] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!allowed || !isBranchId(id)) return;
    let cancelled = false;
    getBranch(id).then(
      (b) => {
        if (cancelled) return;
        setFromSample(b?.sample ?? false);
        setDraft(
          b
            ? {
                name: b.name,
                content: b.content,
                airbnbUrl: b.airbnbUrl,
                naverUrl: b.naverUrl,
              }
            : { name: "", content: EMPTY, airbnbUrl: null, naverUrl: null },
        );
      },
      () => !cancelled && setMessage("숙소를 불러오지 못했습니다."),
    );
    return () => {
      cancelled = true;
    };
  }, [allowed, id]);

  if (!allowed)
    return (
      <p role="alert" className="text-base">
        숙소 콘텐츠 편집 권한이 없습니다.
      </p>
    );
  if (!isBranchId(id))
    return <p className="text-base">숙소 주소 이름이 올바르지 않습니다.</p>;
  if (!draft) return <p className="text-base">{message ?? "불러오는 중…"}</p>;

  const c = draft.content;
  const setC = (patch: Partial<BranchContent>) =>
    setDraft({ ...draft, content: { ...c, ...patch } });
  const booking = readBooking(c.booking);
  const setBooking = (patch: Partial<BookingSettings>) =>
    setC({ booking: { ...booking, ...patch } });

  async function addPhotos(files: FileList | null) {
    if (!files || !draft) return;
    setUploading(true);
    setMessage(null);
    try {
      const added: BranchContent["photos"] = [];
      for (const f of Array.from(files).slice(0, 20 - c.photos.length)) {
        added.push({ url: await uploadBranchPhoto(id, f), caption: "" });
      }
      setDraft((d) =>
        d
          ? {
              ...d,
              content: {
                ...d.content,
                photos: [...d.content.photos, ...added],
              },
            }
          : d,
      );
    } catch (e) {
      setMessage(
        `사진을 올리지 못했습니다. (${e instanceof Error ? e.message : String(e)})`,
      );
    } finally {
      setUploading(false);
    }
  }

  function movePhoto(i: number, dir: -1 | 1) {
    const photos = [...c.photos];
    const j = i + dir;
    if (j < 0 || j >= photos.length) return;
    [photos[i], photos[j]] = [photos[j], photos[i]];
    setC({ photos });
  }

  async function save() {
    if (!draft) return;
    const clean = normalizeBranch(draft);
    const problems = validateBranch(clean);
    setErrors(problems);
    setMessage(null);
    if (problems.length > 0) return;
    setBusy(true);
    try {
      await saveBranch(id, clean, user, name);
      setDraft(clean);
      setFromSample(false);
      setMessage("저장했습니다. 숙소 화면에 바로 반영됩니다.");
    } catch {
      setMessage(
        "저장하지 못했습니다. 권한을 확인하거나 잠시 뒤 다시 시도해 주세요.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <Link href="/admin/branches" className="text-sm text-ink-2 underline">
            ← 숙소 목록
          </Link>
          <h1 className="text-2xl font-semibold">숙소 편집 · /stay/{id}</h1>
        </div>
        <Link
          href={`/stay/${id}`}
          target="_blank"
          className={`${btn} inline-flex items-center`}
        >
          숙소 화면 보기
        </Link>
      </div>
      {fromSample && (
        <p className="rounded-lg bg-warn-soft px-4 py-3 text-base text-warn">
          샘플 내용에서 시작합니다. 저장하면 실제 숙소로 등록되어
          &lsquo;샘플&rsquo; 표시가 사라집니다.
        </p>
      )}

      <Section title="기본 정보">
        <Grid>
          <Field label="지점 이름 (목록용)">
            <input
              className={field}
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </Field>
          <Field label="지점 표시 (예: 온기로 홍성 1호점)">
            <input
              className={field}
              value={c.label}
              onChange={(e) => setC({ label: e.target.value })}
            />
          </Field>
          <Field label="제목 (예: 감나무집 · 1978년 목구조 한옥 독채)">
            <input
              className={field}
              value={c.headline}
              onChange={(e) => setC({ headline: e.target.value })}
            />
          </Field>
          <Field label="요약 (예: 최대 4인 · 침실 2 · 욕실 1)">
            <input
              className={field}
              value={c.summary}
              onChange={(e) => setC({ summary: e.target.value })}
            />
          </Field>
        </Grid>
      </Section>

      <Section title={`사진 (${c.photos.length}/20) · 첫 사진이 대표 사진`}>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {c.photos.map((p, i) => (
            <li
              key={`${p.url}-${i}`}
              className="flex flex-col gap-2 rounded-lg border border-line p-2"
            >
              {p.url ? (
                // eslint-disable-next-line @next/next/no-img-element -- Storage 공개 주소를 그대로 보여준다
                <img
                  src={p.url}
                  alt={p.caption || `사진 ${i + 1}`}
                  className="aspect-[4/3] w-full rounded object-cover"
                />
              ) : (
                <div className="flex aspect-[4/3] w-full items-center justify-center rounded bg-surface-2 text-sm text-muted">
                  파일 없음 (샘플 자리)
                </div>
              )}
              <input
                className={field}
                placeholder="사진 설명 (필수)"
                value={p.caption}
                onChange={(e) =>
                  setC({
                    photos: c.photos.map((x, j) =>
                      j === i ? { ...x, caption: e.target.value } : x,
                    ),
                  })
                }
              />
              <div className="flex justify-between">
                <div>
                  <button
                    type="button"
                    className={small}
                    disabled={i === 0}
                    onClick={() => movePhoto(i, -1)}
                  >
                    ← 앞으로
                  </button>
                  <button
                    type="button"
                    className={small}
                    disabled={i === c.photos.length - 1}
                    onClick={() => movePhoto(i, 1)}
                  >
                    뒤로 →
                  </button>
                </div>
                <button
                  type="button"
                  className={small}
                  onClick={() =>
                    setC({ photos: c.photos.filter((_, j) => j !== i) })
                  }
                >
                  빼기
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div>
          <label
            className={`${btn} inline-flex cursor-pointer items-center ${uploading ? "opacity-40" : ""}`}
          >
            {uploading ? "올리는 중…" : "+ 사진 올리기"}
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              disabled={uploading || c.photos.length >= 20}
              onChange={(e) => {
                void addPhotos(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        <p className="text-xs text-muted">
          사진은 긴 변 1600px로 줄이고 위치정보를 지운 뒤 올립니다. 사람
          얼굴·차량 번호판이 보이지 않게 해 주세요.
        </p>
      </Section>

      <Section title="청결 관리">
        <Grid>
          <Field label="한 줄 제목 (예: 체크아웃마다 전문 청소)">
            <input
              className={field}
              value={c.cleaning.headline}
              onChange={(e) =>
                setC({ cleaning: { ...c.cleaning, headline: e.target.value } })
              }
            />
          </Field>
          <Field label="세부 내용">
            <input
              className={field}
              value={c.cleaning.detail}
              onChange={(e) =>
                setC({ cleaning: { ...c.cleaning, detail: e.target.value } })
              }
            />
          </Field>
        </Grid>
      </Section>

      <Section title="편의·안전 시설">
        <Field label="한 줄에 하나씩 (예: 소화기)">
          <textarea
            className={area}
            value={c.amenities.join("\n")}
            onChange={(e) => setC({ amenities: e.target.value.split("\n") })}
          />
        </Field>
      </Section>

      <Section title="체험">
        {c.experiences.map((x, i) => (
          <div
            key={i}
            className="grid items-end gap-2 sm:grid-cols-[1fr_2fr_auto]"
          >
            <Field label="이름">
              <input
                className={field}
                value={x.name}
                onChange={(e) =>
                  setC({
                    experiences: c.experiences.map((y, j) =>
                      j === i ? { ...y, name: e.target.value } : y,
                    ),
                  })
                }
              />
            </Field>
            <Field label="진행자·시간·가격">
              <input
                className={field}
                value={x.detail}
                onChange={(e) =>
                  setC({
                    experiences: c.experiences.map((y, j) =>
                      j === i ? { ...y, detail: e.target.value } : y,
                    ),
                  })
                }
              />
            </Field>
            <button
              type="button"
              className={small}
              onClick={() =>
                setC({ experiences: c.experiences.filter((_, j) => j !== i) })
              }
            >
              빼기
            </button>
          </div>
        ))}
        <div>
          <button
            type="button"
            className={btn}
            onClick={() =>
              setC({
                experiences: [...c.experiences, { name: "", detail: "" }],
              })
            }
          >
            + 체험 추가
          </button>
        </div>
      </Section>

      <Section title="위치·요금·예약">
        <Field label="위치 설명 (예: 홍주읍성 차량 12분)">
          <textarea
            className={area}
            value={c.location}
            onChange={(e) => setC({ location: e.target.value })}
          />
        </Field>
        <Grid>
          <Field label="평일 1박 요금 (원)">
            <NumberInput
              className={field}
              value={Number(c.price.weekday) || undefined}
              placeholder="예: 200,000 또는 20만"
              onChange={(v) => setC({ price: { ...c.price, weekday: v ?? 0 } })}
            />
          </Field>
          <Field label="주말 1박 요금 (원)">
            <NumberInput
              className={field}
              value={Number(c.price.weekend) || undefined}
              placeholder="예: 200,000 또는 20만"
              onChange={(v) => setC({ price: { ...c.price, weekend: v ?? 0 } })}
            />
          </Field>
          <Field label="체크인 (예: 15:00)">
            <input
              className={field}
              value={c.price.checkIn}
              onChange={(e) =>
                setC({ price: { ...c.price, checkIn: e.target.value } })
              }
            />
          </Field>
          <Field label="체크아웃 (예: 11:00)">
            <input
              className={field}
              value={c.price.checkOut}
              onChange={(e) =>
                setC({ price: { ...c.price, checkOut: e.target.value } })
              }
            />
          </Field>
          <Field label="에어비앤비 링크 (없으면 비우기)">
            <input
              className={field}
              placeholder="https://"
              value={draft.airbnbUrl ?? ""}
              onChange={(e) =>
                setDraft({ ...draft, airbnbUrl: e.target.value })
              }
            />
          </Field>
          <Field label="네이버 예약 링크 (없으면 비우기)">
            <input
              className={field}
              placeholder="https://"
              value={draft.naverUrl ?? ""}
              onChange={(e) => setDraft({ ...draft, naverUrl: e.target.value })}
            />
          </Field>
        </Grid>
      </Section>

      <Section title="온기로 예약 신청 (STY-06)">
        <label className="flex min-h-12 items-center gap-3 text-base">
          <input
            type="checkbox"
            className="size-5"
            checked={booking.enabled}
            onChange={(e) => setBooking({ enabled: e.target.checked })}
          />
          숙소 화면에 &lsquo;온기로에서 예약 신청&rsquo; 버튼을 보입니다
        </label>
        <Grid>
          <Field label="최대 인원">
            <NumberInput
              className={field}
              value={booking.maxGuests}
              onChange={(v) => setBooking({ maxGuests: v ?? 1 })}
            />
          </Field>
          <Field label="기준 인원 (넘으면 추가 요금)">
            <NumberInput
              className={field}
              value={booking.baseGuests}
              onChange={(v) => setBooking({ baseGuests: v ?? 1 })}
            />
          </Field>
          <Field label="추가 1인 1박 요금 (원, 없으면 0)">
            <NumberInput
              className={field}
              value={booking.extraGuestFee}
              placeholder="예: 20,000 또는 2만"
              onChange={(v) => setBooking({ extraGuestFee: v ?? 0 })}
            />
          </Field>
          <Field label="최소 박 수">
            <NumberInput
              className={field}
              value={booking.minNights}
              onChange={(v) => setBooking({ minNights: v ?? 1 })}
            />
          </Field>
          <Field label="최대 박 수">
            <NumberInput
              className={field}
              value={booking.maxNights}
              onChange={(v) => setBooking({ maxNights: v ?? 1 })}
            />
          </Field>
        </Grid>
        <Field label="확정 후 입금 안내 (확정된 예약에만 보임, 예: 농협 000-0000-0000 온기로 · 확정 후 24시간 안)">
          <textarea
            className={area}
            value={booking.paymentGuide}
            onChange={(e) => setBooking({ paymentGuide: e.target.value })}
          />
        </Field>
        <Field label="취소·환불 안내 (신청 화면에 보임)">
          <textarea
            className={area}
            value={booking.policy}
            onChange={(e) => setBooking({ policy: e.target.value })}
          />
        </Field>
        <p className="text-sm text-ink-2">
          예약이 안 되는 날(에어비앤비·네이버 예약, 휴무)은{" "}
          <Link href="/admin/reservations" className="underline">
            관리자 → 예약
          </Link>
          에서 막습니다. 확정한 예약의 날짜는 자동으로 막힙니다.
        </p>
      </Section>

      {errors.length > 0 && (
        <ul
          role="alert"
          className="list-disc rounded-lg bg-crit-soft py-3 pl-8 pr-4 text-base text-crit"
        >
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      {message && (
        <p role="status" className="text-base">
          {message}
        </p>
      )}
      <div>
        <button
          type="button"
          className={btnDark}
          disabled={busy || uploading}
          onClick={save}
        >
          {busy ? "저장 중…" : "저장"}
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-ink-2">
      {label}
      {children}
    </label>
  );
}
