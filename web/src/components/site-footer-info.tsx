"use client";

import { companyLines, DEFAULT_COMPANY } from "@/lib/site-content/legal";
import { useCompany } from "@/lib/site-content/store";

// 바닥글 사업자 정보·저작권 (관리 화면 '약관·사업자 정보'에서 고친다, 11/4).
// 읽기 전에는 기본값을 보여 줘 바닥글 높이가 흔들리지 않게 한다
export function SiteFooterInfo() {
  const c = useCompany() ?? DEFAULT_COMPANY;
  return (
    <div className="flex flex-col gap-1 text-sm text-ink-2">
      <p className="flex flex-wrap gap-x-3 gap-y-1">
        {companyLines(c).map((l) => (
          <span key={l}>{l}</span>
        ))}
      </p>
      {c.copyright && <p>{c.copyright}</p>}
    </div>
  );
}
