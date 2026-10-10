"use client";

import { useEffect, useRef, useState } from "react";
import {
  MAX_PHOTOS,
  missingPhotoParts,
  PHOTO_PARTS,
  type PhotoPartId,
} from "@/lib/diagnosis/photos";
import {
  deletePhoto,
  listPhotos,
  photoUrl,
  uploadPhoto,
  type DiagnosisPhoto,
} from "@/lib/diagnosis/photo-store";
import { finishStep } from "@/lib/diagnosis/store";
import { useDiagnosis } from "./diagnosis-context";
import {
  btnGhost,
  btnPrimary,
  btnSecondary,
  card,
  info,
  notice,
} from "./styles";

// 3단계 사진 업로드 (SIM-06, task.md 6.4). 사진 없이도 다음으로 갈 수 있다(누락 부위만큼 불확실도 가산).
// 사진 정책(D8) 확정 전까지는 운영팀 계정에만 업로드를 연다 (시연은 팀 계정으로 진행, task.md 11.2).
export function PhotosStep() {
  const { user, isTeam, assessment, reload, go } = useDiagnosis();
  const [photos, setPhotos] = useState<DiagnosisPhoto[] | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<PhotoPartId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isTeam) return;
    let cancelled = false;
    listPhotos(assessment.id)
      .then((list) => !cancelled && setPhotos(list))
      .catch(() => !cancelled && setError("사진 목록을 불러오지 못했습니다."));
    return () => {
      cancelled = true;
    };
  }, [isTeam, assessment.id]);

  // 미리보기 주소는 사진마다 한 번만 받는다
  const requested = useRef(new Set<string>());
  useEffect(() => {
    for (const p of photos ?? []) {
      if (requested.current.has(p.id)) continue;
      requested.current.add(p.id);
      photoUrl(p.storagePath)
        .then((u) => setUrls((m) => ({ ...m, [p.id]: u })))
        .catch(() => {});
    }
  }, [photos]);

  async function add(part: PhotoPartId, files: FileList | null) {
    if (!files || !photos) return;
    setError(null);
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      setError(`사진은 최대 ${MAX_PHOTOS}장까지 올릴 수 있습니다.`);
      return;
    }
    setUploading(part);
    try {
      for (const f of Array.from(files).slice(0, room)) {
        const added = await uploadPhoto(user.uid, assessment.id, part, f);
        setPhotos((list) => [...(list ?? []), added]);
      }
      if (files.length > room)
        setError(`최대 ${MAX_PHOTOS}장까지만 올렸습니다.`);
    } catch {
      setError("사진을 올리지 못했습니다. 다른 사진으로 다시 시도해 주세요.");
    } finally {
      setUploading(null);
    }
  }

  async function remove(photo: DiagnosisPhoto) {
    setError(null);
    try {
      await deletePhoto(assessment.id, photo);
      setPhotos((list) => (list ?? []).filter((p) => p.id !== photo.id));
    } catch {
      setError("사진을 지우지 못했습니다.");
    }
  }

  async function next() {
    setBusy(true);
    try {
      await finishStep(assessment, "photos");
      await reload();
      go("checklist");
    } catch {
      setError("저장하지 못했습니다. 잠시 뒤 다시 시도해 주세요.");
      setBusy(false);
    }
  }

  const footer = (laterLabel: string) => (
    <div className="flex flex-wrap justify-between gap-3">
      <button
        type="button"
        className={btnSecondary}
        onClick={() => go("confirm")}
      >
        이전
      </button>
      <div className="flex gap-2">
        {laterLabel && (
          <button
            type="button"
            className={btnGhost}
            disabled={busy}
            onClick={next}
          >
            {laterLabel}
          </button>
        )}
        <button
          type="button"
          className={btnPrimary}
          disabled={busy || uploading !== null}
          onClick={next}
        >
          다음
        </button>
      </div>
    </div>
  );

  if (!isTeam) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">사진 업로드</h1>
        <p className={info}>
          사진 업로드는 사진 보관 정책이 확정된 뒤에 열립니다. 지금은 건너뛰고
          진행해 주세요. 사진이 없는 부위는 견적에서 &lsquo;현장 확인
          필요&rsquo;로 표시되고 비용 범위가 넓어집니다.
        </p>
        {footer("")}
      </div>
    );
  }

  const parts = (photos ?? []).map((p) => p.part);
  const doneParts = PHOTO_PARTS.length - missingPhotoParts(parts);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-2xl font-semibold">부위별 사진을 올려주세요</h1>
        <span className="text-base text-ink-2">
          {doneParts} / {PHOTO_PARTS.length} 부위 · 사진 {photos?.length ?? 0}장
          (최대 {MAX_PHOTOS}장)
        </span>
      </div>

      {!photos ? (
        <p className="text-base">불러오는 중…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {PHOTO_PARTS.map((part) => {
            const mine = photos.filter((p) => p.part === part.id);
            const inputId = `photo-${part.id}`;
            return (
              <section key={part.id} className={card}>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base font-semibold">
                    {mine.length > 0 ? "✓ " : ""}
                    {part.label}
                  </h2>
                  <span className="text-sm text-muted">{mine.length}장</span>
                </div>
                <p className="text-sm text-ink-2">{part.guide}</p>
                {mine.length > 0 && (
                  <ul className="grid grid-cols-3 gap-2">
                    {mine.map((p) => (
                      <li key={p.id} className="flex flex-col gap-1">
                        {urls[p.id] ? (
                          // eslint-disable-next-line @next/next/no-img-element -- 서명된 Storage 주소라 이미지 최적화를 거치지 않는다
                          <img
                            src={urls[p.id]}
                            alt={`${part.label} 사진`}
                            className="aspect-square w-full rounded-md object-cover"
                          />
                        ) : (
                          <div className="aspect-square w-full rounded-md bg-surface-2" />
                        )}
                        <button
                          type="button"
                          className="min-h-11 text-sm text-ink-2 underline"
                          onClick={() => remove(p)}
                        >
                          삭제
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <label
                  htmlFor={inputId}
                  className={`${btnSecondary} cursor-pointer ${uploading ? "pointer-events-none opacity-40" : ""}`}
                >
                  {uploading === part.id ? "올리는 중…" : "+ 사진 추가"}
                </label>
                <input
                  id={inputId}
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  disabled={uploading !== null}
                  onChange={(e) => {
                    void add(part.id, e.target.files);
                    e.target.value = "";
                  }}
                />
              </section>
            );
          })}
        </div>
      )}

      <p className={info}>
        사진은 운영팀이 견적을 검수할 때만 봅니다. 위치정보(EXIF)는 올리기 전에
        지우고, 보관 기간은 정책 확정 후 안내합니다. 사진만으로 구조 안전을
        판단하지 않습니다.
      </p>
      <p className={notice}>
        사진이 없는 부위는 견적에서 &lsquo;현장 확인 필요&rsquo;로 표시되고 비용
        범위가 넓어집니다.
      </p>
      {error && (
        <p role="alert" className="text-base text-crit">
          {error}
        </p>
      )}
      {footer("나중에 올리기")}
    </div>
  );
}
