"use client";

import { useCallback, useState } from "react";
import {
  canEditLegal,
  CompanyEditor,
  LegalDocEditor,
} from "@/components/admin/legal-editor";
import { useStaff } from "@/components/admin/staff-context";
import { DEFAULT_COMPANY, type CompanyInfo } from "@/lib/site-content/legal";

// 약관·사업자 정보 (D8, 11/4). 바닥글·/terms·/privacy 내용을 고친다
export default function LegalAdminPage() {
  const { permissions } = useStaff();
  const [company, setCompany] = useState<CompanyInfo>(DEFAULT_COMPANY);
  const onSaved = useCallback((c: CompanyInfo) => setCompany(c), []);

  if (!canEditLegal(permissions))
    return <p className="text-base">이 화면을 고칠 권한이 없습니다.</p>;

  return (
    <div className="flex flex-col gap-12">
      <h1 className="text-2xl font-semibold">약관·사업자 정보</h1>
      <CompanyEditor onSaved={onSaved} />
      <LegalDocEditor kind="privacy" company={company} />
      <LegalDocEditor kind="terms" company={company} />
    </div>
  );
}
