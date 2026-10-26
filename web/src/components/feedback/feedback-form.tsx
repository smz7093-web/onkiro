"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuthUser } from "@/lib/auth/use-auth-user";
import {
  FEEDBACK_LIMITS,
  safeFromPage,
  submitFeedback,
  TESTER_LABELS,
  TESTER_TYPES,
  validateFeedback,
  type TesterType,
} from "@/lib/feedback/store";
import { Button, Card, Notice } from "../ui";

const area =
  "min-h-28 w-full rounded-md border border-line-2 bg-surface px-3 py-2 text-base text-ink";
const choice = (on: boolean) =>
  `flex min-h-12 cursor-pointer items-center gap-2 rounded-md border px-3 text-base ${
    on ? "border-accent bg-accent-soft" : "border-line-2 bg-surface"
  }`;

const SCALE = [1, 2, 3, 4, 5];

// 의견 보내기 (10/26). 이름·연락처는 받지 않는다
export function FeedbackForm({ from }: { from: string | null }) {
  const user = useAuthUser();
  const [testerType, setTesterType] = useState<TesterType>("owner");
  const [rating, setRating] = useState(0);
  const [trust, setTrust] = useState<number | null>(null);
  const [good, setGood] = useState("");
  const [improve, setImprove] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [failed, setFailed] = useState(false);

  async function send() {
    const input = {
      testerType,
      rating,
      trust,
      good,
      improve,
      page: safeFromPage(from),
    };
    const errs = validateFeedback(input);
    setErrors(errs);
    if (errs.length) return;
    setBusy(true);
    setFailed(false);
    try {
      await submitFeedback(input, user ?? null);
      setSent(true);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  if (sent)
    return (
      <Card>
        <h1 className="text-2xl font-semibold">고맙습니다</h1>
        <p className="text-base">
          보내 주신 의견은 온기로 팀이 모두 읽고, 고친 내용은 서비스에
          반영합니다.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/" className="text-base underline underline-offset-4">
            홈으로
          </Link>
          <Link href="/me" className="text-base underline underline-offset-4">
            내 진단·상담
          </Link>
        </div>
      </Card>
    );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">써 보신 의견을 알려 주세요</h1>
        <p className="text-base text-ink-2">
          1분이면 됩니다. 이름이나 연락처는 묻지 않으니, 의견 칸에도 개인정보는
          적지 말아 주세요.
        </p>
      </div>

      <Card>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-base font-semibold">어떤 분이세요?</legend>
          <div className="flex flex-wrap gap-2">
            {TESTER_TYPES.map((t) => (
              <label key={t} className={choice(testerType === t)}>
                <input
                  type="radio"
                  name="tester"
                  className="size-5"
                  checked={testerType === t}
                  onChange={() => setTesterType(t)}
                />
                {TESTER_LABELS[t]}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-base font-semibold">
            전체적으로 얼마나 만족하셨나요?
          </legend>
          <div className="flex flex-wrap gap-2">
            {SCALE.map((n) => (
              <label key={n} className={choice(rating === n)}>
                <input
                  type="radio"
                  name="rating"
                  className="size-5"
                  checked={rating === n}
                  onChange={() => setRating(n)}
                />
                {n}
              </label>
            ))}
          </div>
          <span className="text-sm text-ink-2">1 매우 불만 · 5 매우 만족</span>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-base font-semibold">
            공사비·수익 결과를 믿을 만했나요?
          </legend>
          <div className="flex flex-wrap gap-2">
            {SCALE.map((n) => (
              <label key={n} className={choice(trust === n)}>
                <input
                  type="radio"
                  name="trust"
                  className="size-5"
                  checked={trust === n}
                  onChange={() => setTrust(n)}
                />
                {n}
              </label>
            ))}
            <label className={choice(trust === null)}>
              <input
                type="radio"
                name="trust"
                className="size-5"
                checked={trust === null}
                onChange={() => setTrust(null)}
              />
              결과까지 안 봄
            </label>
          </div>
          <span className="text-sm text-ink-2">1 전혀 아님 · 5 매우 그렇다</span>
        </fieldset>

        <label className="flex flex-col gap-1 text-base font-semibold">
          좋았던 점
          <textarea
            className={area}
            value={good}
            maxLength={FEEDBACK_LIMITS.text}
            placeholder="예: 사진만 올렸는데 공정별 금액이 나와서 좋았어요"
            onChange={(e) => setGood(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-base font-semibold">
          불편했거나 고쳤으면 하는 점
          <textarea
            className={area}
            value={improve}
            maxLength={FEEDBACK_LIMITS.text}
            placeholder="예: 체크리스트 문항이 어려웠어요, 글씨가 작아요"
            onChange={(e) => setImprove(e.target.value)}
          />
        </label>

        {errors.length > 0 && (
          <Notice tone="crit" role="alert">
            {errors.join(" · ")}
          </Notice>
        )}
        {failed && (
          <p role="alert" className="text-base text-crit">
            보내지 못했습니다. 잠시 뒤 다시 시도해 주세요.
          </p>
        )}
        <div>
          <Button variant="primary" disabled={busy} onClick={send}>
            {busy ? "보내는 중…" : "의견 보내기"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
