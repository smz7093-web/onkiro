// 팀원 산출물 번호 표시 (prd.md 3.2절 D1~D15). 관리 화면 메뉴·제목에서 어느 산출물을 입력하는 곳인지 보여준다
export const D_LABELS: Record<string, string> = {
  D2: "1호점 실제 공사비 (석원)",
  D3: "공정 분류·모듈 A/B/C 구성 (해순·석원)",
  D4: "체크리스트 판정표·위험 신호 (석원)",
  D5: "단가·상태계수·작업일·불확실도 (석원)",
  D6: "수익 가정값·3안 편차 (원일)",
  D7: "인허가 간이 확인 항목 (원일)",
  D9: "촬영 가이드 (해순)",
  D12: "숙소 콘텐츠 (해순)",
  D13: "상담 처리 기준 (원일)",
};

export function DTag({ ids }: { ids: string[] }) {
  return (
    <span className="inline-flex gap-1 align-middle">
      {ids.map((id) => (
        <abbr
          key={id}
          title={D_LABELS[id]}
          className="rounded bg-accent-soft px-1.5 py-0.5 text-xs font-semibold text-accent no-underline"
        >
          {id}
        </abbr>
      ))}
    </span>
  );
}
