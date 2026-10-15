import { BranchCards, HeroPhoto } from "@/components/home/branch-showcase";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { ButtonLink, Card, Pill } from "@/components/ui";

// 서비스 소개 홈 (COM-01, task.md 9.4). 문구는 목업 home·PRD 기준이며 주연의 홈 문구가 오면 바꾼다.
// 버튼: 내 빈집 진단하기 → /diagnose(로그인·동의 후 주소 입력), 빈집 맡기기 상담 → /consult?type=entrust

const PILLARS = [
  {
    step: "진단",
    title: "주소 → 공정별 견적",
    body: "건축물대장·토지·관광 데이터를 자동으로 불러와 지붕·구조·설비별 공사비 범위와 공사 기간을 계산합니다.",
  },
  {
    step: "재생",
    title: "등급별 리모델링 · 공사 관리",
    body: "기본형·표준형·고급형 실내 마감 중에서 고르고, 공사 진행은 온기로 PM이 관리합니다.",
  },
  {
    step: "운영",
    title: "스테이 오픈 · 운영",
    body: "숙박업 신고부터 예약 사이트 등록까지 오픈을 돕고, 직영점 실적으로 계산 기준을 계속 보정합니다.",
  },
];

const ENTRUST = [
  ["투자", "온기로가 리모델링 비용 부담"],
  ["운영", "계약 기간 직영 운영 · 수익 배분"],
  ["반환", "계약 종료 시 고쳐진 집 반환"],
] as const;

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-paper text-ink">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 py-10 md:py-14">
        <section className="grid items-center gap-8 md:grid-cols-[1.2fr_1fr]">
          <div className="flex flex-col gap-5">
            <p className="text-sm font-semibold tracking-wide text-accent">
              빈집 진단 · 재생 · 스테이 운영
            </p>
            <h1 className="text-3xl leading-tight font-bold md:text-4xl">
              빈집을 발견한 순간부터
              <br />첫 손님을 맞는 날까지
            </h1>
            <p className="max-w-[52ch] text-lg text-ink-2">
              주소와 사진만 넣으면 공정별 공사비와 공사 기간, 스테이로 운영했을
              때의 월 수익과 회수 기간을 근거와 함께 보여드립니다.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/diagnose" variant="primary">
                내 빈집 진단하기
              </ButtonLink>
              <ButtonLink href="/consult?type=entrust">
                빈집 맡기기 상담
              </ButtonLink>
            </div>
            <p className="text-sm text-ink-2">
              모든 금액은 추정치이며 데이터 출처와 가정값을 함께 표시합니다.
            </p>
          </div>
          <HeroPhoto />
        </section>

        <section aria-labelledby="pillars" className="flex flex-col gap-4">
          <h2 id="pillars" className="sr-only">
            온기로가 하는 일
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {PILLARS.map((p) => (
              <Card key={p.step} variant="flat">
                <p className="text-sm font-semibold text-accent">{p.step}</p>
                <h3 className="text-lg font-semibold">{p.title}</h3>
                <p className="text-base text-ink-2">{p.body}</p>
              </Card>
            ))}
          </div>
        </section>

        <Card aria-labelledby="entrust">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="entrust" className="text-xl font-semibold">
              빈집 맡기기 — 투자하고, 운영하고, 더 좋은 집으로 돌려드립니다
            </h2>
            <Pill tone="ochre" dot={false}>
              운영 조건은 협의 사항
            </Pill>
          </div>
          <dl className="grid gap-3 md:grid-cols-3">
            {ENTRUST.map(([k, v]) => (
              <div
                key={k}
                className="flex flex-col gap-1 rounded-md bg-surface-2 p-4"
              >
                <dt className="text-sm font-semibold text-accent">{k}</dt>
                <dd className="text-base">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="text-sm text-ink-2">
            집 상태·위치·계약 기간에 따라 위탁 가능 여부와 조건이 달라집니다.
            상담에서 함께 확인합니다.
          </p>
          <div>
            <ButtonLink href="/consult?type=entrust">
              빈집 맡기기 상담
            </ButtonLink>
          </div>
        </Card>

        <section aria-labelledby="branches" className="flex flex-col gap-4">
          <h2 id="branches" className="text-xl font-semibold">
            온기로가 고친 집
          </h2>
          <BranchCards />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
