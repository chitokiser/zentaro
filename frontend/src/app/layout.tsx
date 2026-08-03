import type { Metadata, Viewport } from "next";
import { Playfair_Display, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartProvider } from "@/lib/cart-context";
import { I18nProvider } from "@/lib/i18n/i18n-context";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";

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
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ZENTARO",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a1912",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${playfair.variable} ${notoSansKr.variable} dark h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "ZENTARO",
              legalName: "CÔNG TY TNHH SẢN XUẤT VÀ THƯƠNG MẠI RƯỢU PHÚC LỘC",
              url: "https://zentaro.netlify.app",
              logo: "https://zentaro.netlify.app/images/brand/logo.png",
              address: {
                "@type": "PostalAddress",
                streetAddress: "Tổ dân phố Liên Sơn, Phường Tiền Phong",
                addressLocality: "Thành phố Bắc Ninh",
                addressRegion: "Tỉnh Bắc Ninh",
                addressCountry: "VN",
              },
              email: "phuclochd8386@gmail.com",
              telephone: "+84396340222",
              sameAs: [
                "https://www.youtube.com/@WilliamCater-d8h",
                "https://www.instagram.com/zentaro119/",
                "https://t.me/+Gtu15GAUikliYzg1",
                "https://www.facebook.com/profile.php?id=61591465442279",
              ],
            }),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function shouldSuppress(errorMsg, errorStack, filename) {
                  const msg = errorMsg || '';
                  const stack = errorStack || '';
                  const file = filename || '';
                  return file.includes('chrome-extension:') ||
                         stack.includes('chrome-extension:') ||
                         msg.includes('l is not a function') ||
                         stack.includes('registerSolanaInjectedWallet');
                }

                window.addEventListener('error', function(event) {
                  const errorMsg = event.message;
                  const errorStack = event.error ? event.error.stack : '';
                  const filename = event.filename;
                  if (shouldSuppress(errorMsg, errorStack, filename)) {
                    event.stopImmediatePropagation();
                    event.stopPropagation();
                    event.preventDefault();
                  }
                }, true);

                window.addEventListener('unhandledrejection', function(event) {
                  const reason = event.reason;
                  const errorMsg = reason ? (reason.message || String(reason)) : '';
                  const errorStack = reason ? (reason.stack || '') : '';
                  if (shouldSuppress(errorMsg, errorStack, '')) {
                    event.stopImmediatePropagation();
                    event.stopPropagation();
                    event.preventDefault();
                  }
                }, true);
              })();
            `
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <I18nProvider>
          <CartProvider>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
            <PwaInstallPrompt />
          </CartProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
