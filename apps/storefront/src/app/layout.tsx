import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "JALALI COSMETICS | پخش جلالی",
    template: "%s | JALALI COSMETICS",
  },
  description:
    "پخش جلالی؛ مرکز تخصصی عرضه عمده محصولات آرایشی، بهداشتی و زیبایی با خدمات حرفه‌ای برای فروشگاه‌ها و همکاران.",
  applicationName: "JALALI COSMETICS",
  keywords: [
    "پخش جلالی",
    "JALALI COSMETICS",
    "خرید عمده لوازم آرایشی",
    "محصولات آرایشی",
    "محصولات بهداشتی",
    "فروش عمده",
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "JALALI COSMETICS",
    description: "BEAUTY. BUSINESS. TRUST.",
    type: "website",
    locale: "fa_IR",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B0B0D",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
                        }
