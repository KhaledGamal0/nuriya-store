import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Instrument_Serif, Poppins } from "next/font/google";
import { BagProvider } from "@/components/BagProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "./globals.css";

const display = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-display", display: "swap" });
const body = Poppins({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-body", display: "swap" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <BagProvider>
          <Header />
          <main id="main">{children}</main>
          <Footer />
        </BagProvider>
      </body>
    </html>
  );
}
