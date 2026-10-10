"use client";

import { useState } from "react";
import {
  editFact,
  FACT_DEFS,
  FACT_SOURCE_LABELS,
  missingRequired,
  parseFactInput,
  type Fact,
  type FactDef,
  type Facts,
} from "@/lib/diagnosis/facts";
import { saveFacts } from "@/lib/diagnosis/store";
import { useDiagnosis } from "./diagnosis-context";
import { btnPrimary, btnSecondary, card, input, notice } from "./styles";

const GROUPS: { id: FactDef["group"]; title: string }[] = [
  { id: "building", title: "건축물대장" },
  { id: "land", title: "토지 정보" },
  { id: "manual", title: "직접 입력" },
];

const UNIT: Partial<Record<FactDef["kind"], string>> = {
  area: "㎡",
  count: "개",
};

const shown = (v: Fact["value"]) => (v === null ? "" : String(v));

// 2단계 자동조회 확인·수정 (SIM-02, 03, 05, task.md 6.3).
// 외부 조회(4.3, 4.4) 전에는 모든 값을 직접 입력한다. 값마다 출처를 보여주고, 조회값을 고치면 원래 값을 함께 저장한다.
export function ConfirmStep() {
  const { assessment, property, reload, go } = useDiagnosis();
  const [facts, setFacts] = useState<Facts>(property?.facts ?? {});
  // 입력 중인 글자 (숫자 칸에 "72." 같은 중간 입력을 살리려고 따로 둔다)
  const [drafts, setDrafts] = useState<Partial<Record<string, string>>>({});
  const [noRegistry, setNoRegistry] = useState(property?.noRegistry ?? false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!property) {
    return (
      <p className={notice}>
        주소를 먼저 입력해 주세요.{" "}
        <button
          type="button"
          className="underline"
          onClick={() => go("address")}
        >
          주소 입력으로
        </button>
      </p>
    );
  }
  const propertyId = property.id;
  const missing = missingRequired(facts);

  function change(def: FactDef, raw: string) {
    setDrafts((d) => ({ ...d, [def.key]: raw }));
    setFacts((f) => ({
      ...f,
      [def.key]: editFact(f[def.key], parseFactInput(def.kind, raw)),
    }));
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await saveFacts(assessment, propertyId, facts, noRegistry);
      await reload();
      go("photos");
    } catch {
      setError("저장하지 못했습니다. 잠시 뒤 다시 시도해 주세요.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">빈집 정보를 확인해 주세요</h1>
        <p className="text-base text-ink-2">{property.addressRoad}</p>
      </div>

      <p className={notice}>
        공공 데이터 자동 조회는 준비 중입니다. 아는 값을 직접 입력해 주세요.
        비워 둔 값은 &lsquo;결측&rsquo;으로 표시되고 견적 범위가 넓어질 수
        있어요.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {GROUPS.map((g) => (
          <section key={g.id} className={card}>
            <h2 className="text-lg font-semibold">{g.title}</h2>
            {FACT_DEFS.filter((d) => d.group === g.id).map((def) => {
              const fact = facts[def.key];
              const value = drafts[def.key] ?? shown(fact?.value ?? null);
              const id = `fact-${def.key}`;
              return (
                <div key={def.key} className="flex flex-col gap-1">
                  <label htmlFor={id} className="text-sm text-ink-2">
                    {def.label}
                    {def.required && " (필수)"}
                    {UNIT[def.kind] && ` · ${UNIT[def.kind]}`}
                  </label>
                  {def.options ? (
                    <select
                      id={id}
                      className={input}
                      value={value}
                      onChange={(e) => change(def, e.target.value)}
                    >
                      <option value="">모름 · 비워 두기</option>
                      {def.options.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={id}
                      className={input}
                      type={def.kind === "date" ? "date" : "text"}
                      inputMode={
                        def.kind === "area"
                          ? "decimal"
                          : def.kind === "text" || def.kind === "date"
                            ? undefined
                            : "numeric"
                      }
                      value={value}
                      onChange={(e) => change(def, e.target.value)}
                    />
                  )}
                  <FactMeta fact={fact} />
                </div>
              );
            })}
          </section>
        ))}

        <section className={card}>
          <h2 className="text-lg font-semibold">건축물대장이 없나요?</h2>
          <label className="flex min-h-12 items-start gap-3 text-base">
            <input
              type="checkbox"
              className="mt-1 size-5"
              checked={noRegistry}
              onChange={(e) => setNoRegistry(e.target.checked)}
            />
            <span>
              대장 없음 (무허가·미등기 건물)
              <span className="block text-sm text-ink-2">
                결과에 &lsquo;인허가 리스크&rsquo;가 표시되고 견적 범위가
                넓어집니다.
              </span>
            </span>
          </label>
        </section>
      </div>

      {missing.length > 0 && (
        <p className="text-base text-crit">
          {missing
            .map((k) => FACT_DEFS.find((d) => d.key === k)!.label)
            .join(", ")}
          을(를) 입력해야 다음 단계로 갈 수 있어요.
        </p>
      )}
      {error && (
        <p role="alert" className="text-base text-crit">
          {error}
        </p>
      )}
      <div className="flex justify-between gap-3">
        <button
          type="button"
          className={btnSecondary}
          onClick={() => go("address")}
        >
          이전
        </button>
        <button
          type="button"
          className={btnPrimary}
          disabled={busy || missing.length > 0}
          onClick={save}
        >
          {busy ? "저장 중…" : "확인했어요, 다음"}
        </button>
      </div>
    </div>
  );
}

function FactMeta({ fact }: { fact: Fact | undefined }) {
  if (!fact || fact.value === null) {
    return (
      <span className="w-fit rounded bg-warn-soft px-2 py-0.5 text-xs text-warn">
        결측
      </span>
    );
  }
  return (
    <span className="text-xs text-muted">
      출처: {FACT_SOURCE_LABELS[fact.source]}
      {fact.fetchedAt &&
        ` · 조회 ${new Date(fact.fetchedAt).toLocaleString("ko-KR")}`}
      {fact.userEdited &&
        ` · 수정함 (원래 값 ${shown(fact.originalValue) || "없음"})`}
    </span>
  );
}
