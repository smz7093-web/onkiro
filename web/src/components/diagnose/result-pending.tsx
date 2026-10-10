"use client";

import {
  evaluateChecklist,
  type ChecklistAnswers,
} from "@/lib/engine/checklist";
import { CHECKLIST_QUESTIONS } from "@/lib/engine/checklist";
import { useDiagnosis } from "./diagnosis-context";
import { btnSecondary, card, info } from "./styles";

// 견적·수익 화면 자리 (task.md 7.1, 7.3에서 만든다). 지금은 입력이 저장된 것만 보여준다.
export function ResultPending({ title }: { title: string }) {
  const { assessment, property, go } = useDiagnosis();
  const complete = CHECKLIST_QUESTIONS.every(
    (q) => assessment.checklist[q.id] !== undefined,
  );
  const result = complete
    ? evaluateChecklist(assessment.checklist as ChecklistAnswers)
    : null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className={info}>
        결과 화면은 준비 중입니다. 입력한 내용은 저장되어 있습니다.
      </p>
      <section className={card}>
        <h2 className="text-lg font-semibold">저장된 입력</h2>
        <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-base">
          <dt className="text-ink-2">주소</dt>
          <dd>{property?.addressRoad ?? "–"}</dd>
          <dt className="text-ink-2">연면적</dt>
          <dd>{property?.facts.floorArea?.value ?? "–"}㎡</dd>
          <dt className="text-ink-2">대장 없음</dt>
          <dd>{property?.noRegistry ? "예" : "아니오"}</dd>
          <dt className="text-ink-2">체크리스트</dt>
          <dd>
            {complete
              ? `10문항 완료 · 모름 ${result!.unknownAnswers}개`
              : "미완료"}
          </dd>
        </dl>
      </section>
      <div>
        <button
          type="button"
          className={btnSecondary}
          onClick={() => go("checklist")}
        >
          체크리스트로 돌아가기
        </button>
      </div>
    </div>
  );
}
