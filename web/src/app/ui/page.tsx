// 공통 UI 컴포넌트 견본 (task.md 6.7). 개발 중 확인용이며 배포본에서는 404로 숨긴다.
// 주소: /ui. 컴포넌트를 만들 때마다 아래에 "이름 + 쓰임새 + 실제 모양" 칸을 하나씩 추가한다.

import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  Button,
  ButtonLink,
  Card,
  CardHead,
  DisclaimerBox,
  Notice,
  Pill,
  StepBar,
} from "@/components/ui";

export const metadata = { title: "UI 견본 · 온기로" };

const COLORS = [
  ["paper", "bg-paper"],
  ["surface", "bg-surface"],
  ["surface-2", "bg-surface-2"],
  ["ink", "bg-ink"],
  ["ink-2", "bg-ink-2"],
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

function Sample({
  name,
  use,
  children,
}: {
  name: string;
  use: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 border-t border-line pt-6">
      <h2 className="text-lg font-semibold">
        {name} <code className="text-sm text-muted">components/ui</code>
      </h2>
      <p className="text-base text-ink-2">{use}</p>
      {children}
    </section>
  );
}

export default function UiSamplesPage() {
  // 시연 준비(10/19): 배포본(검토 URL)에서는 숨기고 로컬 개발 서버에서만 보인다
  if (process.env.NODE_ENV === "production") notFound();
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

      <Sample
        name="Button · ButtonLink"
        use="primary는 화면당 하나(다음 단계·신청), secondary는 보조 동작, ghost는 덜 중요한 이동, danger는 삭제. sm은 표 안 작은 동작에만."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">견적 계산하기</Button>
          <Button>임시 저장</Button>
          <Button variant="ghost">나중에 하기</Button>
          <Button variant="danger">진단 삭제</Button>
          <Button variant="primary" disabled>
            비활성
          </Button>
          <Button size="sm">편집</Button>
          <ButtonLink href="/ui" variant="secondary">
            링크 버튼
          </ButtonLink>
        </div>
        <div className="max-w-sm">
          <Button variant="primary" block>
            가득 찬 버튼 (휴대폰 하단)
          </Button>
        </div>
      </Sample>

      <Sample
        name="Card · CardHead"
        use="화면 안의 묶음. flat은 보조 정보, highlight는 선택·추천된 항목."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <Card>
            <CardHead
              title="공사 조건"
              aside={<Pill tone="accent">기본</Pill>}
            />
            <p className="text-base">기본 카드</p>
          </Card>
          <Card variant="flat">
            <CardHead title="참고" />
            <p className="text-base">flat 카드</p>
          </Card>
          <Card variant="highlight">
            <CardHead
              title="중 · 표준형"
              aside={<Pill tone="good">추천</Pill>}
            />
            <p className="text-base">highlight 카드</p>
          </Card>
        </div>
      </Sample>

      <Sample
        name="Notice"
        use="화면 안 안내. warn 주의, info 참고, crit 위험·오류, neutral 일반."
      >
        <Notice tone="warn" title="현장 확인 필요">
          사진이 없는 부위는 견적 범위가 넓어집니다.
        </Notice>
        <Notice tone="info">조회 결과는 시연용 저장 데이터입니다.</Notice>
        <Notice tone="crit" title="전문가 진단 필수">
          큰 균열이 있어 구조 안전 확인이 먼저 필요합니다.
        </Notice>
        <Notice tone="neutral">일반 안내 문구입니다.</Notice>
      </Sample>

      <Sample
        name="Pill"
        use="상태 표시(상담 단계, 인허가 확인 상태, AI 가상 이미지 표시 등). 점이 있어 색을 구분하기 어려워도 배지임을 알 수 있다."
      >
        <div className="flex flex-wrap gap-2">
          <Pill>기본</Pill>
          <Pill tone="good">확인됨</Pill>
          <Pill tone="warn">확인 필요</Pill>
          <Pill tone="crit">위험 신호</Pill>
          <Pill tone="info">접수</Pill>
          <Pill tone="accent">진행 중</Pill>
          <Pill tone="ochre">임시 기준값</Pill>
          <Pill tone="warn" dot={false}>
            AI 가상 이미지 · 실제 시공 결과와 다를 수 있음
          </Pill>
        </div>
      </Sample>

      <Sample
        name="StepBar"
        use="진단 단계 표시줄. 지나온 단계는 눌러서 돌아가고, 아직 못 여는 단계는 흐리게. 휴대폰에서는 옆으로 밀어 본다."
      >
        <StepBar
          label="진단 단계 견본"
          steps={[
            { id: "address", label: "주소", state: "done", href: "/ui" },
            { id: "confirm", label: "정보 확인", state: "done", href: "/ui" },
            { id: "photos", label: "사진", state: "current" },
            { id: "checklist", label: "상태", state: "todo" },
            { id: "estimate", label: "견적", state: "todo" },
            { id: "revenue", label: "수익", state: "todo" },
          ]}
        />
      </Sample>

      <Sample
        name="DisclaimerBox"
        use="결과 화면 아래 상시 면책 문구(추정치, 계산 기준일, 버전)."
      >
        <DisclaimerBox>
          이 금액은 입력하신 정보와 기준값으로 계산한 <b>추정치</b>이며 실제
          공사비·수익과 다를 수 있습니다. 계산 기준일 2026. 10. 15. · 단가
          v2026.10-1 · 계산식 v1.1
        </DisclaimerBox>
      </Sample>
    </main>
  );
}
