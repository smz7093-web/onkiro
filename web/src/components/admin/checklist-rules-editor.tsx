"use client";

import {
  CHECKLIST_QUESTIONS,
  DEFAULT_CHECKLIST_RULES,
  RISK_FLAG_LABELS,
  uncoveredAnswers,
} from "@/lib/engine/checklist";
import {
  PROCESS_IDS,
  PROCESS_LABELS,
  type ChecklistRule,
  type ConditionGrade,
  type ProcessId,
  type RiskFlagId,
} from "@/lib/engine/types";

const GRADE_LABEL: Record<ConditionGrade, string> = {
  good: "양호",
  partial: "부분 보수",
  full: "전면 교체",
};
const RISK_IDS = Object.keys(RISK_FLAG_LABELS) as RiskFlagId[];

const questionOf = (id: string) => CHECKLIST_QUESTIONS.find((q) => q.id === id);
const answerLabel = (q: string, a: string) =>
  questionOf(q)?.options.find((o) => o.id === a)?.label ?? a;

// 체크리스트 판정표 (D4, task.md 3.7). 단가 DB 버전의 일부라 초안에서만 고치고 PM이 적용한다.
// 한 줄 = "이 문항에 이 답이면 → 이 공정을 이 판정으로 (+ 위험 신호)". 한 공정에 여러 줄이 걸리면 가장 나쁜 판정.
export function ChecklistRulesEditor({
  rules,
  setRules,
  readOnly,
}: {
  rules: ChecklistRule[] | undefined;
  setRules: (next: ChecklistRule[]) => void;
  readOnly: boolean;
}) {
  const list = rules ?? DEFAULT_CHECKLIST_RULES;
  const usingDefault = rules === undefined;
  const missing = uncoveredAnswers(list);
  const cell =
    "h-10 rounded-md border border-zinc-300 bg-white px-2 text-base text-ink disabled:bg-zinc-50 disabled:text-ink disabled:opacity-100";

  const update = (i: number, patch: Partial<ChecklistRule>) =>
    setRules(list.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const remove = (i: number) => setRules(list.filter((_, j) => j !== i));
  const add = (question = "leak", answer?: string) =>
    setRules([
      ...list,
      {
        question,
        answer: answer ?? questionOf(question)!.options[0].id,
        process: null,
        grade: null,
        risk: null,
      },
    ]);

  // 문항 순서대로 보여준다 (입력 순서와 관계없이 읽기 쉽게)
  const order = (r: ChecklistRule) =>
    CHECKLIST_QUESTIONS.findIndex((q) => q.id === r.question) * 10 +
    (questionOf(r.question)?.options.findIndex((o) => o.id === r.answer) ?? 0);
  const rows = list
    .map((r, i) => ({ r, i }))
    .sort((a, b) => order(a.r) - order(b.r));

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">체크리스트 판정표 (D4)</h2>
      <p className="text-sm text-zinc-600">
        한 줄은 &ldquo;이 문항에 이 답이면 → 이 공정을 이 판정으로&rdquo;입니다.
        위험 신호를 고르면 결과 화면에 &lsquo;전문가 진단 필수&rsquo;가 뜹니다.
        한 공정에 여러 줄이 걸리면 가장 나쁜 판정을 씁니다. 공정 없이 위험
        신호만 있는 줄도 됩니다.
        {usingDefault &&
          " 이 버전에는 판정표가 없어 기본 판정표(욕실·주방, 위험 신호 2개)를 보여줍니다."}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left text-base">
          <thead>
            <tr className="border-b border-zinc-300 text-sm text-zinc-600">
              <th className="py-2 pr-2">문항</th>
              <th className="py-2 pr-2">답</th>
              <th className="py-2 pr-2">공정</th>
              <th className="py-2 pr-2">판정</th>
              <th className="py-2 pr-2">위험 신호</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ r, i }) => {
              const q = questionOf(r.question);
              const incomplete =
                (r.process === null) !== (r.grade === null) ||
                (!r.process && !r.risk);
              return (
                <tr
                  key={i}
                  className={`border-b border-zinc-100 ${incomplete ? "bg-amber-50" : ""}`}
                >
                  <td className="py-1 pr-2">
                    <select
                      className={`${cell} w-64`}
                      disabled={readOnly}
                      value={r.question}
                      onChange={(e) =>
                        update(i, {
                          question: e.target.value,
                          answer: questionOf(e.target.value)!.options[0].id,
                        })
                      }
                    >
                      {CHECKLIST_QUESTIONS.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-1 pr-2">
                    <select
                      className={cell}
                      disabled={readOnly}
                      value={r.answer}
                      onChange={(e) => update(i, { answer: e.target.value })}
                    >
                      {q?.options.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-1 pr-2">
                    <select
                      className={cell}
                      disabled={readOnly}
                      value={r.process ?? ""}
                      onChange={(e) =>
                        update(i, {
                          process: (e.target.value || null) as ProcessId | null,
                          grade: e.target.value ? (r.grade ?? "partial") : null,
                        })
                      }
                    >
                      <option value="">–</option>
                      {PROCESS_IDS.map((p) => (
                        <option key={p} value={p}>
                          {PROCESS_LABELS[p]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-1 pr-2">
                    <select
                      className={cell}
                      disabled={readOnly || !r.process}
                      value={r.grade ?? ""}
                      onChange={(e) =>
                        update(i, {
                          grade: (e.target.value ||
                            null) as ConditionGrade | null,
                        })
                      }
                    >
                      <option value="">–</option>
                      {(["good", "partial", "full"] as const).map((g) => (
                        <option key={g} value={g}>
                          {GRADE_LABEL[g]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-1 pr-2">
                    <select
                      className={cell}
                      disabled={readOnly}
                      value={r.risk ?? ""}
                      onChange={(e) =>
                        update(i, {
                          risk: (e.target.value || null) as RiskFlagId | null,
                        })
                      }
                    >
                      <option value="">–</option>
                      {RISK_IDS.map((id) => (
                        <option key={id} value={id}>
                          {RISK_FLAG_LABELS[id]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-1 text-right">
                    {!readOnly && (
                      <button
                        type="button"
                        className="min-h-10 px-2 text-sm text-zinc-600 underline"
                        onClick={() => remove(i)}
                      >
                        삭제
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!readOnly && (
        <div>
          <button
            type="button"
            className="h-11 rounded-lg border border-zinc-300 px-4 text-base"
            onClick={() => add()}
          >
            + 줄 추가
          </button>
        </div>
      )}
      <details className="text-sm text-zinc-700">
        <summary className="min-h-10 cursor-pointer py-2">
          판정표에 없는 답 {missing.length}개 (이 답들은 어떤 공정에도 영향을
          주지 않습니다)
        </summary>
        <ul className="flex flex-wrap gap-2 pb-2">
          {missing.map((m) => (
            <li key={`${m.question}:${m.answer}`}>
              {readOnly ? (
                <span className="rounded bg-zinc-100 px-2 py-1">
                  {questionOf(m.question)?.label} →{" "}
                  {answerLabel(m.question, m.answer)}
                </span>
              ) : (
                <button
                  type="button"
                  className="rounded bg-zinc-100 px-2 py-1 hover:bg-zinc-200"
                  onClick={() => add(m.question, m.answer)}
                >
                  + {questionOf(m.question)?.label} →{" "}
                  {answerLabel(m.question, m.answer)}
                </button>
              )}
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
