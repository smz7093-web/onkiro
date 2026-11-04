"use client";

import Link from "next/link";
import {
  fillPlaceholders,
  LEGAL_TITLE,
  type LegalKind,
} from "@/lib/site-content/legal";
import { useCompany, useLegalDoc } from "@/lib/site-content/store";
import { LegalText } from "./legal-text";

// 이용약관·개인정보 처리방침 화면 (11/4). 내용은 관리 화면 '약관·사업자 정보'에서 고친다
export function LegalPage({ kind }: { kind: LegalKind }) {
  const doc = useLegalDoc(kind);
  const company = useCompany();
  const other: LegalKind = kind === "terms" ? "privacy" : "terms";

  return (
    <article className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{LEGAL_TITLE[kind]}</h1>
      {!doc || !company ? (
        <p className="text-base text-ink-2">불러오는 중…</p>
      ) : (
        <>
          <p className="text-sm text-ink-2">시행일 {doc.effectiveDate}</p>
          <LegalText
            text={fillPlaceholders(doc.body, company, doc.effectiveDate)}
          />
        </>
      )}
      <p className="border-t border-line pt-4 text-base">
        <Link href={`/${other}`} className="underline underline-offset-4">
          {LEGAL_TITLE[other]} 보기
        </Link>
      </p>
    </article>
  );
}
