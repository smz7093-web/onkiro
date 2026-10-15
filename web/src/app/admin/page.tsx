import Link from "next/link";
import { DTag } from "@/components/admin/d-tag";

// 관리자 첫 화면. 메뉴마다 입력하는 팀원 산출물 번호(D#, prd.md 3.2절)와 담당을 함께 보인다
const MENUS: { href: string; label: string; d: string[]; desc: string }[] = [
  {
    href: "/admin/consults",
    label: "상담",
    d: ["D13"],
    desc: "상담 접수·단계·담당자·메모 관리, 전화 접수 대리 입력 (CON-02). D13(원일) 처리 기준은 PM이 단계 이동 규칙에 반영",
  },
  {
    href: "/admin/prices",
    label: "단가 DB",
    d: ["D2", "D3", "D4", "D5"],
    desc: "공정별 단가·모듈 단가·상태계수·불확실도(D5, 석원), 체크리스트 판정표(D4, 석원). 초안에서 고치고 PM이 적용 (ADM-01)",
  },
  {
    href: "/admin/assumptions",
    label: "가정값",
    d: ["D6"],
    desc: "수익 시뮬레이터 기본값·3안 편차(D6, 원일). 초안에서 고치고 PM이 적용 (ADM-02)",
  },
  {
    href: "/admin/permits",
    label: "인허가 항목",
    d: ["D7"],
    desc: "견적 화면·리포트의 숙박 영업 간이 확인 문구(D7, 원일). 저장 즉시 반영",
  },
  {
    href: "/admin/photo-guides",
    label: "촬영 가이드",
    d: ["D9"],
    desc: "진단 사진 단계의 부위별 안내 문구(D9, 해순). 저장 즉시 반영",
  },
  {
    href: "/admin/branches",
    label: "숙소",
    d: ["D12"],
    desc: "숙소 상세 화면 콘텐츠·사진·예약 링크(D12, 해순). 저장 즉시 반영 (STY-01·02)",
  },
  {
    href: "/admin/users",
    label: "회원·권한",
    d: [],
    desc: "운영팀 계정과 권한 관리, 관리자 전용 (ADM-05)",
  },
];

export default function AdminHome() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">관리자</h1>
      <p className="text-base text-ink-2">
        D 번호는 팀원 산출물 번호입니다. 번호에 마우스를 올리면 내용과 담당이
        보입니다. D2·D3은 단가 DB 값의 근거 자료라 따로 입력하는 칸은 없습니다.
      </p>
      <ul className="flex flex-col gap-3 text-base">
        {MENUS.map((m) => (
          <li key={m.href} className="flex flex-col gap-1">
            <span className="flex flex-wrap items-center gap-2">
              <Link href={m.href} className="font-semibold underline">
                {m.label}
              </Link>
              {m.d.length > 0 && <DTag ids={m.d} />}
            </span>
            <span className="text-ink-2">{m.desc}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
