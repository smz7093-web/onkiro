import type { SocialValue } from "@/lib/site-content/social-value";
import { ButtonLink, Card, Pill } from "./ui";

// '사회적 가치' 페이지 본문 (11/26). 공개 페이지와 관리 화면 미리보기가 같이 쓴다
export function SocialValueView({ content }: { content: SocialValue }) {
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <Pill tone="accent" dot={false}>
          예비사회적기업
        </Pill>
        <h1 className="border-l-4 border-brand pl-4 font-display text-3xl leading-tight font-bold md:text-4xl">
          사회적 가치
        </h1>
        {content.designation && (
          <p className="text-base font-semibold text-accent">
            {content.designation}
          </p>
        )}
        <p className="max-w-[60ch] text-lg whitespace-pre-line text-ink-2">
          {content.mission}
        </p>
      </section>

      {content.items.length > 0 && (
        <section aria-labelledby="sv-work" className="flex flex-col gap-4">
          <h2 id="sv-work" className="text-xl font-semibold">
            온기로가 하는 공익 사업
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {content.items.map((i, n) => (
              <Card key={n} variant="flat">
                <p className="text-sm font-semibold text-accent">
                  {String(n + 1).padStart(2, "0")}
                </p>
                <h3 className="text-lg font-semibold">{i.title}</h3>
                <p className="text-base whitespace-pre-line text-ink-2">
                  {i.body}
                </p>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/diagnose" variant="primary">
          내 빈집 진단하기
        </ButtonLink>
        <ButtonLink href="/consult?type=entrust">빈집 맡기기 상담</ButtonLink>
      </section>
    </div>
  );
}
