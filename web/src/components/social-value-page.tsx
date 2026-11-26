"use client";

import { useSocialValue } from "@/lib/site-content/store";
import { SocialValueView } from "./social-value-view";
import { ButtonLink } from "./ui";

// 공개 '사회적 가치' 페이지 (/social-value). 관리 화면에서 켜기 전에는 준비 중으로 보인다
export function SocialValuePage() {
  const content = useSocialValue();
  if (content === undefined)
    return <div className="h-96 rounded-lg bg-surface-2" aria-busy="true" />;
  if (!content?.enabled)
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="text-2xl font-semibold">사회적 가치</h1>
        <p className="text-base text-ink-2">페이지를 준비하고 있습니다.</p>
        <ButtonLink href="/">홈으로</ButtonLink>
      </div>
    );
  return <SocialValueView content={content} />;
}

// 홈 소개 칸: 예비사회적기업 지정과 미션 첫 문장, '사회적 가치' 바로가기. 켜져 있을 때만 보인다
export function SocialValueHomeCard() {
  const content = useSocialValue();
  if (!content?.enabled) return null;
  const first = content.mission.split(/(?<=[.!?。])\s+/)[0] ?? content.mission;
  return (
    <section
      aria-labelledby="home-social"
      className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-6"
    >
      <p className="text-sm font-semibold text-accent">예비사회적기업</p>
      <h2 id="home-social" className="text-xl font-semibold">
        {content.designation || "온기로는 예비사회적기업입니다"}
      </h2>
      <p className="max-w-[60ch] text-base text-ink-2">{first}</p>
      <div>
        <ButtonLink href="/social-value">온기로의 사회적 가치 보기</ButtonLink>
      </div>
    </section>
  );
}
