export const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;
export const man = (n: number) =>
  `${Math.round(n / 10_000).toLocaleString("ko-KR")}만 원`;
export const pct = (n: number, digits = 0) => `${(n * 100).toFixed(digits)}%`;
export const dateTime = (d: Date | null) =>
  d
    ? d.toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" })
    : "–";

export const STATUS_LABEL = {
  draft: "초안",
  active: "적용 중",
  retired: "이전 버전",
} as const;
export const STATUS_STYLE = {
  draft: "bg-warn-soft text-warn",
  active: "bg-good-soft text-good",
  retired: "bg-surface-2 text-ink-2",
} as const;
