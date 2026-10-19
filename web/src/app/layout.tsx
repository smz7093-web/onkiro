import type { Metadata } from "next";
import { Hahmlet, IBM_Plex_Sans_KR } from "next/font/google";
import "./globals.css";

// 글꼴 (10/19 주연 확정): 본문 IBM Plex Sans KR, 홈 큰 제목만 Hahmlet.
// 한글 글꼴은 크기가 커서 미리 받지 않고(preload: false) 화면에 필요한 글자 묶음만 내려받는다.
const plex = IBM_Plex_Sans_KR({
  weight: ["400", "600", "700"],
  variable: "--font-plex",
  display: "swap",
  preload: false,
});

const hahmlet = Hahmlet({
  weight: ["600", "700"],
  variable: "--font-hahmlet",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "온기로",
  description: "빈집 진단·공사비 견적·스테이 수익 시뮬레이션",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${plex.variable} ${hahmlet.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
