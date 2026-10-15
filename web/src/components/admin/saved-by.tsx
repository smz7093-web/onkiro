import type { Edited } from "@/lib/site-content/store";

// 마지막 저장자·시각 (화면 문구 편집 화면 공통)
export function SavedBy({ edited }: { edited: Edited<unknown> | null }) {
  if (!edited) return null;
  if (!edited.updatedAt)
    return (
      <p className="text-sm text-ink-2">
        아직 저장한 적이 없어 기본 문구가 쓰이고 있습니다.
      </p>
    );
  return (
    <p className="text-sm text-ink-2">
      마지막 저장: {edited.updatedByName ?? "이름 없음"} ·{" "}
      {edited.updatedAt.toLocaleString("ko-KR")}
    </p>
  );
}
