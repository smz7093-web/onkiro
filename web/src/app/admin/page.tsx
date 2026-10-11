import Link from "next/link";

export default function AdminHome() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">관리자</h1>
      <ul className="flex flex-col gap-2 text-base">
        <li>
          <Link href="/admin/consults" className="underline">
            상담
          </Link>{" "}
          — 상담 접수·단계·담당자·메모 관리, 전화 접수 대리 입력 (CON-02)
        </li>
        <li>
          <Link href="/admin/prices" className="underline">
            단가 DB
          </Link>{" "}
          — 공정별 단가·상태계수·불확실도 버전 관리 (ADM-01)
        </li>
        <li>
          <Link href="/admin/assumptions" className="underline">
            가정값
          </Link>{" "}
          — 수익 시뮬레이터 기본값·3안 편차 버전 관리 (ADM-02)
        </li>
        <li>
          <Link href="/admin/branches" className="underline">
            숙소
          </Link>{" "}
          — 숙소 상세 화면 콘텐츠·사진·예약 링크 편집, 콘텐츠 편집 권한
          (STY-01·02)
        </li>
        <li>
          <Link href="/admin/users" className="underline">
            회원·권한
          </Link>{" "}
          — 운영팀 계정과 권한 관리, 관리자 전용 (ADM-05)
        </li>
      </ul>
    </div>
  );
}
