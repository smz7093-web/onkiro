// 공통 UI 컴포넌트 견본 (task.md 6.7, 담당: 주연). 개발 중 확인용이며 시연 전에 지운다.
// 주소: /ui. 컴포넌트를 만들 때마다 아래에 "이름 + 쓰임새 + 실제 모양" 칸을 하나씩 추가한다.

export const metadata = { title: "UI 견본 · 온기로" };

const COLORS = [
  ["paper", "bg-paper"],
  ["surface", "bg-surface"],
  ["ink", "bg-ink"],
  ["muted", "bg-muted"],
  ["line", "bg-line"],
  ["accent", "bg-accent"],
  ["accent-soft", "bg-accent-soft"],
  ["ochre", "bg-ochre"],
  ["good", "bg-good"],
  ["warn", "bg-warn"],
  ["crit", "bg-crit"],
  ["info", "bg-info"],
] as const;

export default function UiSamplesPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 bg-paper px-4 py-8 text-ink">
      <h1 className="text-2xl font-semibold">UI 견본</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">색 (목업 토큰)</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {COLORS.map(([name, cls]) => (
            <div key={name} className="flex items-center gap-2 text-base">
              <span
                className={`size-10 rounded-md border border-line ${cls}`}
              />
              {name}
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">컴포넌트</h2>
        <p className="text-base text-muted">
          아직 없습니다. Button부터 만들어 여기에 붙이세요
          (components/ui/index.ts 참고).
        </p>
      </section>
    </main>
  );
}
