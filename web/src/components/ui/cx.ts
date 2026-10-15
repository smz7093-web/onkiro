// 클래스 이름 합치기 (빈 값은 버린다)
export const cx = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(" ");
