"use client";

import { useEffect, useState } from "react";
import { can } from "@/lib/permissions";
import {
  deleteKnowledge,
  importDefaultKnowledge,
  KNOWLEDGE_LIMITS,
  KNOWLEDGE_TAGS,
  listKnowledge,
  saveKnowledge,
  TAG_HINTS,
  validateKnowledge,
  type KnowledgeDoc,
} from "@/lib/permits/knowledge";
import { Button, Card, Notice, Pill } from "../ui";
import { useStaff } from "./staff-context";
import { DTag } from "./d-tag";

const field =
  "h-12 w-full rounded-md border border-line-2 bg-surface px-3 text-base text-ink";
const area =
  "min-h-32 w-full rounded-md border border-line-2 bg-surface px-3 py-2 text-base text-ink";

const nextId = (docs: KnowledgeDoc[]) => {
  const n = Math.max(
    0,
    ...docs.map((d) => Number(/^K(\d+)$/.exec(d.id)?.[1] ?? 0)),
  );
  return `K${String(n + 1).padStart(2, "0")}`;
};

// AI 인허가 안내(RAG)의 인허가 자료 편집 (10/26, D7 원일 검토).
// AI는 여기 있는 자료 중 집 정보·묻는 말에 맞는 것만 찾아 근거로 쓴다. 저장하면 다음 질문부터 바로 반영된다.
export function PermitKnowledgeEditor() {
  const { user, name, permissions } = useStaff();
  const allowed =
    can(permissions, "canEditAssumptions") ||
    can(permissions, "canEditContent");
  const [docs, setDocs] = useState<KnowledgeDoc[] | null>(null);
  const [editing, setEditing] = useState<KnowledgeDoc | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    listKnowledge().then(
      (r) => !cancelled && setDocs(r),
      () => !cancelled && setMessage("불러오지 못했습니다."),
    );
    return () => {
      cancelled = true;
    };
  }, [allowed]);

  if (!allowed)
    return (
      <p role="alert" className="text-base">
        인허가 자료 편집 권한이 없습니다(가정값 또는 콘텐츠 편집 권한 필요).
      </p>
    );
  if (!docs) return <p className="text-base">{message ?? "불러오는 중…"}</p>;

  async function run(work: () => Promise<string>) {
    setBusy(true);
    setMessage(null);
    try {
      setMessage(await work());
      setDocs(await listKnowledge());
    } catch {
      setMessage("저장하지 못했습니다. 권한을 확인해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    const errs = validateKnowledge(editing!);
    setErrors(errs);
    if (errs.length) return;
    await run(async () => {
      await saveKnowledge(editing!, user, name);
      setEditing(null);
      return "저장했습니다. 다음 AI 인허가 안내부터 반영됩니다.";
    });
  }

  const reviewed = docs.filter((d) => d.reviewed).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">
          인허가 자료 (AI 안내 근거) <DTag ids={["D7"]} />
        </h1>
        <p className="text-base text-ink-2">
          견적 화면의 &lsquo;AI 인허가 안내&rsquo;가 찾아 쓰는 자료입니다. AI는
          이 집의 정보(주용도·도로·지붕·대장 유무·운영 방식)와 회원이 묻는 말로
          맞는 자료를 최대 6개 찾고, 그 자료에 적힌 내용만 근거로 안내합니다.
        </p>
        <Notice tone="info">
          본문에는 확인한 사실만 쓰고, 바뀔 수 있는 숫자·기간은 &lsquo;관할
          기관 확인&rsquo;을 함께 적어 주세요. 검토를 마친 자료는 &lsquo;검토
          완료&rsquo;를 켜면 회원 화면의 &lsquo;담당자 검토 전 자료&rsquo;
          표시가 사라집니다.
        </Notice>
        <p className="text-sm text-ink-2">
          자료 {docs.length}개 · 검토 완료 {reviewed}개
        </p>
      </div>

      {docs.length === 0 && (
        <Card>
          <p className="text-base">
            저장된 자료가 없어 지금은 기본 자료(PM 초안 16개)로 안내합니다.
            불러와 저장하면 여기서 고칠 수 있습니다.
          </p>
          <div>
            <Button
              variant="primary"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  const n = await importDefaultKnowledge(user, name);
                  return `기본 자료 ${n}개를 저장했습니다.`;
                })
              }
            >
              기본 자료 불러오기
            </Button>
          </div>
        </Card>
      )}

      {message && (
        <p role="status" className="text-base">
          {message}
        </p>
      )}

      {editing && (
        <Card>
          <h2 className="text-lg font-semibold">
            {docs.some((d) => d.id === editing.id) ? "자료 고치기" : "새 자료"}{" "}
            · {editing.id}
          </h2>
          <label className="flex flex-col gap-1 text-sm text-ink-2">
            제목
            <input
              className={field}
              value={editing.title}
              maxLength={KNOWLEDGE_LIMITS.title}
              onChange={(e) =>
                setEditing({ ...editing, title: e.target.value })
              }
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-ink-2">
            출처 (법령·기관, 예: 농어촌정비법 시행규칙)
            <input
              className={field}
              value={editing.source}
              maxLength={KNOWLEDGE_LIMITS.source}
              onChange={(e) =>
                setEditing({ ...editing, source: e.target.value })
              }
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-ink-2">
            링크 (선택, 국가법령정보센터 등)
            <input
              className={field}
              value={editing.url ?? ""}
              maxLength={KNOWLEDGE_LIMITS.url}
              onChange={(e) =>
                setEditing({ ...editing, url: e.target.value || null })
              }
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-ink-2">
            본문 ({editing.body.length} / {KNOWLEDGE_LIMITS.body}자)
            <textarea
              className={area}
              value={editing.body}
              maxLength={KNOWLEDGE_LIMITS.body}
              onChange={(e) => setEditing({ ...editing, body: e.target.value })}
            />
          </label>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm text-ink-2">
              주제 태그 (어떤 집에 이 자료를 찾아 줄지)
            </legend>
            <div className="flex flex-wrap gap-2">
              {KNOWLEDGE_TAGS.map((t) => {
                const on = editing.tags.includes(t);
                return (
                  <label
                    key={t}
                    className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-md border px-3 text-base ${
                      on
                        ? "border-accent bg-accent-soft"
                        : "border-line-2 bg-surface"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="size-5"
                      checked={on}
                      disabled={!on && editing.tags.length >= KNOWLEDGE_LIMITS.tags}
                      onChange={() =>
                        setEditing({
                          ...editing,
                          tags: on
                            ? editing.tags.filter((x) => x !== t)
                            : [...editing.tags, t],
                        })
                      }
                    />
                    {t}
                    <span className="text-sm text-ink-2">({TAG_HINTS[t]})</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          <label className="flex min-h-12 items-center gap-2 text-base">
            <input
              type="checkbox"
              className="size-5"
              checked={editing.reviewed}
              onChange={(e) =>
                setEditing({ ...editing, reviewed: e.target.checked })
              }
            />
            검토 완료 (담당 팀원이 내용을 확인함)
          </label>
          {errors.length > 0 && (
            <Notice tone="crit" role="alert" title="저장하기 전에 고쳐 주세요">
              <ul className="list-disc pl-5">
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </Notice>
          )}
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" disabled={busy} onClick={save}>
              {busy ? "저장 중…" : "저장"}
            </Button>
            <Button
              disabled={busy}
              onClick={() => {
                setEditing(null);
                setErrors([]);
              }}
            >
              취소
            </Button>
          </div>
        </Card>
      )}

      {!editing && docs.length > 0 && (
        <div>
          <Button
            onClick={() =>
              setEditing({
                id: nextId(docs),
                title: "",
                source: "",
                url: null,
                body: "",
                tags: [],
                reviewed: false,
              })
            }
          >
            + 자료 추가
          </Button>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {docs.map((d) => (
          <li key={d.id}>
            <Card>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-ink-2">{d.id}</span>
                <b className="text-base">{d.title}</b>
                <Pill tone={d.reviewed ? "good" : "warn"}>
                  {d.reviewed ? "검토 완료" : "검토 전"}
                </Pill>
              </div>
              <span className="text-sm text-ink-2">
                {d.source} · 태그 {d.tags.join(", ")}
                {d.updatedByName && ` · 마지막 저장 ${d.updatedByName}`}
              </span>
              <p className="text-base">{d.body}</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={busy || editing !== null}
                  onClick={() => {
                    setEditing(structuredClone(d));
                    setErrors([]);
                  }}
                >
                  고치기
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  disabled={busy || editing !== null}
                  onClick={() => {
                    if (!window.confirm(`${d.id} '${d.title}' 자료를 지울까요?`))
                      return;
                    run(async () => {
                      await deleteKnowledge(d.id);
                      return "지웠습니다.";
                    });
                  }}
                >
                  지우기
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
