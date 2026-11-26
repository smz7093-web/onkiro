import type { SocialValue } from "@/lib/site-content/social-value";
import { ButtonLink, Card, Pill } from "./ui";

// '사회적 가치' 페이지 본문 (11/26). 공개 페이지와 관리 화면 미리보기가 같이 쓴다.
// 순서: 지정·미션·비전 → 공익 사업 → BOT·N 전략 → 성과목표 → 활동 기록(사진) → 진단·상담 버튼
export function SocialValueView({ content }: { content: SocialValue }) {
  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Pill tone="accent" dot={false}>
            예비사회적기업
          </Pill>
        </div>
        <h1 className="border-l-4 border-brand pl-4 font-display text-3xl leading-tight font-bold md:text-4xl">
          사회적 가치
        </h1>
        {content.designation && (
          <p className="text-base font-semibold text-accent">
            {content.designation}
          </p>
        )}
        <dl className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1 rounded-lg bg-surface-2 p-5">
            <dt className="text-sm font-semibold tracking-wide text-accent">
              MISSION · 미션
            </dt>
            <dd className="text-lg font-semibold whitespace-pre-line">
              {content.mission}
            </dd>
          </div>
          {content.vision && (
            <div className="flex flex-col gap-1 rounded-lg bg-surface-2 p-5">
              <dt className="text-sm font-semibold tracking-wide text-accent">
                VISION · 비전
              </dt>
              <dd className="text-lg font-semibold whitespace-pre-line">
                {content.vision}
              </dd>
            </div>
          )}
        </dl>
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

      {content.strategy.length > 0 && (
        <section aria-labelledby="sv-strategy" className="flex flex-col gap-4">
          <h2 id="sv-strategy" className="text-xl font-semibold">
            {content.strategyTitle || "전략"}
          </h2>
          <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {content.strategy.map((s, n) => (
              <li
                key={n}
                className="flex flex-col gap-1 rounded-lg border border-line bg-surface p-5"
              >
                <span className="text-sm font-semibold tracking-wide text-accent">
                  {String(n + 1).padStart(2, "0")}
                  {s.tag && ` · ${s.tag}`}
                </span>
                <span className="text-lg font-semibold">{s.title}</span>
                {s.body && (
                  <span className="text-base text-ink-2">{s.body}</span>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {content.goals.length > 0 && (
        <section aria-labelledby="sv-goals" className="flex flex-col gap-4">
          <h2 id="sv-goals" className="text-xl font-semibold">
            {content.goalsTitle || "사회적 성과목표"}
          </h2>
          <dl className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {content.goals.map((g, n) => (
              <div
                key={n}
                className="flex flex-col items-center gap-1 rounded-lg bg-accent-soft p-5 text-center"
              >
                <dd className="font-display text-3xl font-bold text-accent">
                  {g.value}
                </dd>
                <dt className="text-base">{g.label}</dt>
              </div>
            ))}
          </dl>
          <p className="text-sm text-ink-2">
            앞으로 이루려는 목표이며, 지금까지의 실적이 아닙니다.
          </p>
        </section>
      )}

      {content.activities.length > 0 && (
        <section aria-labelledby="sv-activity" className="flex flex-col gap-6">
          <h2 id="sv-activity" className="text-xl font-semibold">
            활동 기록
          </h2>
          {content.activities.map((a, n) => (
            <article key={n} className="flex flex-col gap-3">
              <div className="flex flex-wrap items-baseline gap-x-3">
                <h3 className="text-lg font-semibold">{a.title}</h3>
                {a.date && <span className="text-sm text-ink-2">{a.date}</span>}
              </div>
              {a.body && (
                <p className="max-w-[70ch] text-base whitespace-pre-line text-ink-2">
                  {a.body}
                </p>
              )}
              {a.photos.length > 0 && (
                <div
                  className={`grid gap-3 ${a.photos.length > 1 ? "md:grid-cols-3" : "md:max-w-2xl"}`}
                >
                  {a.photos.map((p, k) => (
                    <figure key={k} className="flex flex-col gap-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.url}
                        alt={p.caption || a.title}
                        loading="lazy"
                        className={`w-full rounded-md border border-line object-cover ${a.photos.length > 1 ? "aspect-[4/3]" : ""}`}
                      />
                      {p.caption && (
                        <figcaption className="text-sm text-ink-2">
                          {p.caption}
                        </figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              )}
            </article>
          ))}
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
