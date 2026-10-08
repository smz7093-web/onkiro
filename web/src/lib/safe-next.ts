// 로그인·동의 후 돌아갈 경로. 외부 주소나 javascript: 같은 값으로 이동하지 않도록 앱 내부 경로만 허용한다.
export function safeNextPath(value: string | null | undefined, fallback = "/") {
  if (!value || !value.startsWith("/") || value.startsWith("//"))
    return fallback;
  if (value.startsWith("/\\")) return fallback;
  return value;
}
