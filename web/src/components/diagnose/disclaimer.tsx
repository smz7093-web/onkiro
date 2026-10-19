import { FORMULA_VERSION } from "@/lib/engine/version";
import { DisclaimerBox } from "../ui";

// 면책 문구 (prd.md 1.2 원칙 1): 모든 결과에 추정치임, 계산 기준일, 적용 버전을 표시한다.
// 문구는 D8(약관·면책) 확정 후 바꾼다.
export function Disclaimer({
  priceVersion,
  assumptionVersion,
  provisional,
  at = new Date(),
}: {
  priceVersion: string;
  assumptionVersion?: string;
  provisional?: boolean;
  at?: Date;
}) {
  return (
    <DisclaimerBox>
      이 금액은 입력하신 정보와 기준값으로 계산한 <b>추정치</b>이며 실제
      공사비·수익과 다를 수 있습니다. 정확한 금액은 현장진단 후 확정됩니다. AI가
      만든 설명·이미지는 참고용입니다. 계산 기준일{" "}
      {at.toLocaleDateString("ko-KR")} · 단가 {priceVersion}
      {assumptionVersion && ` · 가정값 ${assumptionVersion}`} · 계산식{" "}
      {FORMULA_VERSION}
      {provisional && " · 임시 기준값"}
    </DisclaimerBox>
  );
}
