"use client";

import { useLawChange } from "@/lib/site-content/store";

// 시행 예정 법 개정 참고 (10/31, siteContent/lawChange). 현행 간이 확인과 섞이지 않게 접어서 따로 보여준다.
export function LawChangeNote() {
  const law = useLawChange();
  if (!law.enabled || law.items.length === 0) return null;
  return (
    <details className="rounded-lg border border-line bg-surface-2 px-4 py-3">
      <summary className="flex min-h-12 cursor-pointer items-center text-base font-semibold">
        {law.title}
      </summary>
      <div className="flex flex-col gap-3 pt-2">
        {law.note && <p className="text-sm text-ink-2">{law.note}</p>}
        <ul className="flex flex-col gap-3">
          {law.items.map((i) => (
            <li key={i.title} className="flex flex-col gap-1">
              <b className="text-base">{i.title}</b>
              <span className="text-sm text-ink-2">{i.body}</span>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
