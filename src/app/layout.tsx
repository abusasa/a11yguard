import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { JetBrains_Mono, Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://a11yguard.kz";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "A11yGuard — доступность сайтов в Казахстане",
    template: "%s — A11yGuard",
  },
  description:
    "Проверьте сайт на доступность по WCAG 2.2 и СТ РК 2191-2023. Приоритеты, понятные объяснения и готовые патчи — на русском и казахском.",
  keywords: [
    "доступность сайтов",
    "WCAG 2.2",
    "A11y",
    "Казахстан",
    "СТ РК 2191-2023",
    "инклюзивный дизайн",
    "аудит доступности",
  ],
  authors: [{ name: "A11yGuard" }],
  creator: "A11yGuard",
  openGraph: {
    type: "website",
    locale: "ru_KZ",
    siteName: "A11yGuard",
    title: "A11yGuard — доступность сайтов в Казахстане",
    description:
      "Скан сайта за 5 минут: что мешает людям, что исправить первым и какой код поставить.",
  },
  twitter: {
    card: "summary_large_image",
    title: "A11yGuard — доступность сайтов в Казахстане",
    description:
      "Скан сайта за 5 минут: что мешает людям, что исправить первым и какой код поставить.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f3f0e7",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="ru"
      className={`${manrope.variable} ${jetbrainsMono.variable} scroll-smooth`}
    >
      <body className="min-h-screen bg-paper text-ink antialiased">
        <a className="skip-link" href="#main">
          Перейти к содержанию
        </a>
        {children}
      </body>
    </html>
  );
}
