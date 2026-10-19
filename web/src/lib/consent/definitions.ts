// 가입 동의 항목 (prd.md COM-04, 6.7 약관 개정 규칙).
// 문구·버전은 D8(약관·개인정보 처리방침, 주연) 확정 전 임시 값이다. 문구를 바꾸면 version을 올린다.
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

const DRAFT = "draft-2026-10-08";

export const CONSENT_ITEMS: readonly ConsentItem[] = [
  {
    type: "terms",
    required: true,
    version: DRAFT,
    label: "이용약관",
    detail: "온기로 서비스 이용약관에 동의합니다. (약관 확정 전 임시 문구)",
  },
  {
    type: "privacy",
    required: true,
    version: DRAFT,
    label: "개인정보 수집·이용",
    detail:
      "카카오 계정 닉네임·이메일(선택), 진단 입력 정보, 상담 연락처를 서비스 제공과 상담 연락에 이용합니다. 이용 분석에 Google Analytics를 사용합니다. (처리방침 확정 전 임시 문구)",
  },
  {
    type: "estimateDisclaimer",
    required: true,
    version: DRAFT,
    label: "견적 결과는 추정치임을 확인",
    detail:
      "견적·수익 결과는 입력 정보와 가정값으로 계산한 추정치이며, 정밀 진단·구조 안전 진단·인허가 판단을 대체하지 않습니다.",
  },
  {
    type: "photoReview",
    required: true,
    version: DRAFT,
    label: "진단 사진을 견적 검수에 이용",
    detail:
      "업로드한 사진은 운영팀이 견적을 검수할 때만 봅니다. 위치정보(EXIF)는 지우며, 보관 기간은 정책 확정 예정입니다.",
  },
  {
    type: "photoModel",
    required: false,
    version: DRAFT,
    label: "진단 사진을 견적 모델 개선에 이용",
    detail:
      "식별 정보를 제거한 뒤 견적 정확도 개선에 이용합니다. 동의하지 않아도 서비스를 이용할 수 있고, 나중에 철회할 수 있습니다.",
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
