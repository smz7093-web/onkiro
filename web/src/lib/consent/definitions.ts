// 가입 동의 항목 (prd.md COM-04, 6.7 약관 개정 규칙).
// 문구는 D8(약관·개인정보 처리방침, 원일 검토) 10/20 확정본 5절. 문구를 바꾸면 version을 올린다.
// 필수 항목의 version이 바뀌면 다음 로그인 때 재동의를 받는다.

export type ConsentType =
  | "terms"
  | "privacy"
  | "estimateDisclaimer"
  | "photoReview"
  | "photoModel"
  | "aiProcessing";

export interface ConsentItem {
  type: ConsentType;
  required: boolean;
  version: string;
  label: string;
  detail: string;
}

// 10/20 D8 확정으로 draft-2026-10-08 → 2026-10-20 (기존 회원은 다음 로그인 때 재동의)
const D8 = "2026-10-20";

export const CONSENT_ITEMS: readonly ConsentItem[] = [
  {
    type: "terms",
    required: true,
    version: D8,
    label: "이용약관",
    detail: "온기로 서비스 이용약관에 동의합니다.",
  },
  {
    type: "privacy",
    required: true,
    version: D8,
    label: "개인정보 수집·이용",
    detail:
      "카카오 닉네임·이메일(선택), 진단한 빈집 정보, 상담 연락처를 서비스 제공과 상담 연락에 이용합니다. 보관 기간은 탈퇴 시까지이며, 서비스 개선을 위해 이용 기록을 Google Analytics로 분석합니다.",
  },
  {
    type: "estimateDisclaimer",
    required: true,
    version: D8,
    label: "견적은 추정치임을 확인",
    detail:
      "견적·수익 결과는 입력 정보와 기준값으로 계산한 추정치이며 견적서·수익 보장이 아닙니다. 구조 안전 진단과 인허가 판단을 대신하지 않습니다.",
  },
  {
    type: "photoReview",
    required: true,
    // 10/22 보관 기간을 10/19 팀 확정값(마지막 이용 후 1년)으로 고쳐 이 항목만 재동의
    version: "2026-10-22",
    label: "진단 사진 검수 이용",
    detail:
      "올린 사진은 견적 검수에만 쓰며 권한 있는 담당자만 봅니다. 위치정보는 올리기 전에 지우고, 상담을 신청하지 않으면 마지막 이용 후 1년, 계약하면 계약 종료 후 3년 뒤 삭제합니다. AI 기능은 따로 동의한 경우에만 사진을 AI 서비스로 보냅니다.",
  },
  {
    type: "photoModel",
    required: false,
    version: D8,
    label: "진단 사진 모델 개선 이용",
    detail:
      "개인을 알아볼 수 없게 처리한 뒤 견적 정확도 개선에 이용합니다. 동의하지 않아도 서비스를 이용할 수 있고, 마이페이지에서 언제든 철회할 수 있습니다.",
  },
  {
    // 10/19 D8 확정(원일): 해외 AI 전송은 필수가 아닌 선택 동의로. 동의하지 않으면 AI 기능만 꺼진다
    type: "aiProcessing",
    required: false,
    version: "draft-2026-10-19",
    label: "AI 사진 분석·등급 설명·가상 이미지 이용 (국외 이전)",
    detail:
      "AI 기능을 쓰면 진단 사진과 집 정보(면적·구조·연식·상태 답, 주소 제외)가 Anthropic(미국)과 Google(Vertex AI)로 보내져 분석됩니다. AI 결과는 참고용입니다. 동의하지 않아도 서비스를 이용할 수 있고 AI 기능만 꺼지며, 언제든 철회할 수 있습니다.",
  },
];
