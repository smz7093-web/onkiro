// 진단 6단계 (prd.md 6.2, task.md 6.1). 화면 주소는 /diagnose/{진단 id}/{단계}.
// 이 파일은 React·Firebase를 import하지 않는다.

export const STEPS = [
  { id: "address", label: "주소" },
  { id: "confirm", label: "확인" },
  { id: "photos", label: "사진" },
  { id: "checklist", label: "체크리스트" },
  { id: "estimate", label: "견적" },
  { id: "revenue", label: "수익" },
] as const;

export type StepId = (typeof STEPS)[number]["id"];

export const STEP_IDS: StepId[] = STEPS.map((s) => s.id);

export function stepIndex(id: StepId) {
  return STEP_IDS.indexOf(id);
}

export function isStepId(v: unknown): v is StepId {
  return STEP_IDS.includes(v as StepId);
}

export function nextStep(id: StepId): StepId | null {
  return STEP_IDS[stepIndex(id) + 1] ?? null;
}

export function prevStep(id: StepId): StepId | null {
  return STEP_IDS[stepIndex(id) - 1] ?? null;
}

// 지금까지 도달한 단계(reached)보다 뒤 단계로는 바로 갈 수 없다. 앞 단계는 언제든 돌아가 고칠 수 있다.
export function canOpen(target: StepId, reached: StepId) {
  return stepIndex(target) <= stepIndex(reached);
}

// 한 단계를 마치면 도달 단계를 넓힌다 (뒤로 돌아가 고쳐도 줄이지 않는다)
export function advanceReached(reached: StepId, finished: StepId): StepId {
  const next = nextStep(finished) ?? finished;
  return stepIndex(next) > stepIndex(reached) ? next : reached;
}
