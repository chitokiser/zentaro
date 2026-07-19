import type { Metadata } from "next";
import { Playfair_Display, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const notoSansKr = Noto_Sans_KR({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

const title = "ZENTARO | Every Bottle Tells a Story";
const description =
  "ZENTARO — 프리미엄 크래프트 증류소. Dry Gin, Whisky, Liqueur와 보태니컬 리서치 랩, 그리고 ZENTARO Mall · Bottle Cap Rewards 생태계.";

export const metadata: Metadata = {
  title,
  description,
  metadataBase: new URL("https://zentaro.netlify.app"),
  openGraph: {
    title,
    description,
    url: "https://zentaro.netlify.app",
    siteName: "ZENTARO",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${playfair.variable} ${notoSansKr.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
