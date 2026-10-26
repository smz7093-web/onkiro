"use client";

import { useState } from "react";
import {
  aiErrorMessage,
  askPermitGuide,
  type PermitGuideResult,
  type PermitOperator,
} from "@/lib/ai/store";
import type { Facts } from "@/lib/diagnosis/facts";
import { Pill, type PillTone } from "../ui";
import { AiConsentGate } from "./ai-consent";
import { btnSecondary, input } from "./styles";

const factText = (facts: Facts, key: keyof Facts) => {
  const v = facts[key]?.value;
  return typeof v === "string" && v.trim() ? v.trim() : null;
};

const OPERATORS: { id: PermitOperator; label: string }[] = [
  { id: "owner", label: "제가 그 집에 살면서 운영" },
  { id: "entrust", label: "다른 사람(운영사)에게 맡겨 운영" },
  { id: "unknown", label: "아직 모름" },
];

const LEVEL: Record<
  PermitGuideResult["items"][number]["level"],
  { label: string; tone: PillTone }
> = {
  caution: { label: "주의", tone: "crit" },
  check: { label: "확인 필요", tone: "warn" },
  info: { label: "참고", tone: "info" },
};

// AI 인허가 안내 (RAG, 10/26). 집 정보·운영 방식·묻는 말로 인허가 자료를 찾고,
// AI가 찾은 자료만 근거로 항목별 안내를 쓴다. 항목마다 근거 자료 번호와 출처를 보여준다.
export function PermitGuide({
  assessmentId,
  facts,
  floorArea,
  noRegistry,
}: {
  assessmentId: string;
  facts: Facts;
  floorArea: number | null;
  noRegistry: boolean;
}) {
  const [operator, setOperator] = useState<PermitOperator>("owner");
  const [question, setQuestion] = useState("");
  const [guide, setGuide] = useState<PermitGuideResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask() {
    setBusy(true);
    setError(null);
    try {
      const r = await askPermitGuide(assessmentId, {
        floorArea,
        structure: factText(facts, "structure"),
        approvalDate: factText(facts, "approvalDate"),
        zoning: factText(facts, "zoning"),
        landUse: factText(facts, "landUse"),
        mainPurpose: factText(facts, "mainPurpose"),
        roadSide: factText(facts, "roadSide"),
        roofStructure: factText(facts, "roofStructure"),
        noRegistry,
        operator,
        question: question.trim() || null,
      });
      setGuide(r.result);
    } catch (e) {
      setError(aiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const sourceNo = (id: string) =>
    (guide?.sources.findIndex((s) => s.id === id) ?? -1) + 1;

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-surface-2 p-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold">AI 인허가 안내</h3>
        <p className="text-sm text-ink-2">
          온기로 인허가 자료(법령·기관 안내 정리)에서 이 집에 맞는 자료를 찾아,
          AI가 그 자료만 근거로 정리합니다. 항목마다 근거 자료가 붙습니다.
        </p>
      </div>
      <AiConsentGate>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm text-ink-2">운영 방식</legend>
          <div className="flex flex-wrap gap-2">
            {OPERATORS.map((o) => (
              <label
                key={o.id}
                className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-md border px-3 text-base ${
                  operator === o.id
                    ? "border-accent bg-accent-soft"
                    : "border-line-2 bg-surface"
                }`}
              >
                <input
                  type="radio"
                  name="permit-operator"
                  className="size-5"
                  checked={operator === o.id}
                  onChange={() => {
                    setOperator(o.id);
                    setGuide(null);
                  }}
                />
                {o.label}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="flex flex-col gap-1 text-sm text-ink-2">
          궁금한 점 (선택)
          <input
            className={input}
            value={question}
            maxLength={200}
            placeholder="예: 지하수를 쓰는데 민박 신고 때 필요한 게 있나요?"
            onChange={(e) => {
              setQuestion(e.target.value);
              setGuide(null);
            }}
          />
        </label>
        {!guide && (
          <div>
            <button
              type="button"
              className={btnSecondary}
              disabled={busy}
              onClick={ask}
            >
              {busy
                ? "자료를 찾아 정리하는 중… (10~30초)"
                : "AI 인허가 안내 받기"}
            </button>
          </div>
        )}
        {error && (
          <p role="alert" className="text-base text-crit">
            {error}
          </p>
        )}
        {guide && (
          <div className="flex flex-col gap-3" aria-live="polite">
            <p className="text-base">{guide.summary}</p>
            <ul className="flex flex-col gap-2">
              {guide.items.map((it) => (
                <li
                  key={it.title}
                  className="flex flex-col gap-1 border-b border-line pb-2 last:border-0"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={LEVEL[it.level].tone}>
                      {LEVEL[it.level].label}
                    </Pill>
                    <span className="text-base font-medium">{it.title}</span>
                    <span className="text-sm text-ink-2">
                      근거{" "}
                      {it.sourceIds
                        .map((id) => `[${sourceNo(id)}]`)
                        .join("")}
                    </span>
                  </div>
                  {it.explanation && (
                    <span className="text-base">{it.explanation}</span>
                  )}
                  {it.nextAction && (
                    <span className="text-sm text-ink-2">
                      다음 행동: {it.nextAction}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            {guide.unanswered.length > 0 && (
              <div className="text-sm text-ink-2">
                <b>자료에 없어 답하지 못한 것</b> — 관할 시·군청에 물어보세요:{" "}
                {guide.unanswered.join(" / ")}
              </div>
            )}
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">근거 자료</span>
              <ol className="flex flex-col gap-1 text-sm text-ink-2">
                {guide.sources.map((s, i) => (
                  <li key={s.id}>
                    [{i + 1}] {s.title} · {s.source}
                    {!s.reviewed && " · 담당자 검토 전 자료"}
                    {s.url && (
                      <>
                        {" "}
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="underline underline-offset-2"
                        >
                          법령 보기
                        </a>
                      </>
                    )}
                  </li>
                ))}
              </ol>
            </div>
            <p className="text-sm text-ink-2">
              AI가 온기로 인허가 자료를 근거로 정리한 참고 안내입니다. 법적 판정이
              아니며, 영업 가능 여부는 관할 기관에서 확정됩니다.
            </p>
            <div>
              <button
                type="button"
                className={btnSecondary}
                onClick={() => setGuide(null)}
              >
                다시 묻기
              </button>
            </div>
          </div>
        )}
      </AiConsentGate>
    </div>
  );
}
