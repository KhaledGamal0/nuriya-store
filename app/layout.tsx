import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Sans_Arabic, Instrument_Serif, Poppins } from "next/font/google";
import { BagProvider } from "@/components/BagProvider";
import Script from "next/script";
import { LaunchOffer } from "@/components/LaunchOffer";
import { StoreProvider } from "@/components/StoreProvider";
import { getAreas, getCatalog } from "@/lib/store";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "./globals.css";
import { siteUrl } from "@/lib/site";

const display = Instrument_Serif({ subsets: ["latin"], weight: "400", style: "normal", variable: "--font-display", display: "swap" });
const body = Poppins({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-body", display: "swap" });
const arabic = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500"], variable: "--font-arabic", display: "swap", preload: false });

const SITE_URL = siteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Nuriya — comfy · everyday pieces", template: "%s · Nuriya" },
  description: "Soft, oversized everyday pieces from Cairo. Not loud. Just unforgettable.",
  openGraph: { siteName: "Nuriya", locale: "en_EG", type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [catalog, areas] = await Promise.all([getCatalog(), getAreas()]);
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${display.variable} ${body.variable} ${arabic.variable}`}>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <StoreProvider catalog={catalog} areas={areas}>
        <BagProvider>
          <Header />
          <main id="main">{children}</main>
          <Footer />
          <LaunchOffer />
        </BagProvider>
        </StoreProvider>
        {/* Visitor counts (Vercel Web Analytics): no cookies, no personal data, ~1 KB loaded after everything else. */}
        <Script id="va-init" strategy="afterInteractive">{`window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments)}`}</Script>
        <Script src="/_vercel/insights/script.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
