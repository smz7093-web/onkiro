// 숫자 입력을 너그럽게 읽는다 (UX기준 30 포스텔의 법칙): "173,600", "17.36만", "250만 원", " 15 %" 모두 받는다.
// 빈 칸은 undefined, 읽을 수 없으면 null.
export function parseLenientNumber(raw: string): number | undefined | null {
  let t = raw.replace(/[\s,]/g, "").replace(/(원|㎡|m2|일|개|%|퍼센트)$/i, "");
  if (t === "") return undefined;
  let scale = 1;
  if (/만$/.test(t)) {
    scale = 10_000;
    t = t.slice(0, -1);
  } else if (/천$/.test(t)) {
    scale = 1_000;
    t = t.slice(0, -1);
  }
  if (!/^-?\d+(\.\d+)?$/.test(t)) return null;
  return Math.round(Number(t) * scale * 1e6) / 1e6;
}

// 화면에 보일 때는 천 단위 쉼표 (소수는 그대로)
export function formatNumberInput(n: number | undefined): string {
  if (n === undefined) return "";
  return n.toLocaleString("ko-KR", { maximumFractionDigits: 6 });
}
