import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import { LocaleProvider } from "@/components/locale-provider";
import { TimezoneSync } from "@/components/timezone-sync";
import { getLocale } from "@/lib/locale";
import "./globals.css";

const plex = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "How Much I Paid",
  description: "Log spending for yourself and other people.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f4f4f1",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();

  return (
    <html lang={locale === "zh" ? "zh-CN" : "en"} className={`${plex.variable} h-full`}>
      <body className="min-h-full bg-bg font-sans text-ink antialiased">
        <LocaleProvider locale={locale}>
          <TimezoneSync />
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
