import type { Metadata } from "next";
import { Noto_Sans_TC, Noto_Serif_TC } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/constants";
import { Toaster } from "@/components/ui/sonner";
import { env } from "@/lib/env";

const sansTC = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const serifTC = Noto_Serif_TC({
  variable: "--font-noto-serif-tc",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
});

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} · ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  metadataBase: new URL(env.siteUrl),
  openGraph: {
    title: `${SITE.name} · ${SITE.tagline}`,
    description: SITE.description,
    type: "website",
    locale: "zh_TW",
    siteName: SITE.name,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.name,
    description: SITE.description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-Hant-TW"
      className={`${sansTC.variable} ${serifTC.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="paper-bg min-h-full flex flex-col" suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
