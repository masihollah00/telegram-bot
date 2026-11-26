
import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL = "https://jalali-cosmetics.onrender.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "پخش جلالی | فروشگاه تخصصی لوازم آرایشی و بهداشتی",
    template: "%s | پخش جلالی",
  },

  description:
    "به فروشگاه پخش جلالی خوش آمدید؛ مشاهده محصولات آرایشی، بهداشتی و مراقبت از پوست و مو، بررسی برندها و دسته‌بندی‌ها و آشنایی با شرایط خرید و همکاری عمده.",

  applicationName: "پخش جلالی",

  keywords: [
    "پخش جلالی",
    "خرید لوازم آرایشی",
    "فروشگاه آرایشی و بهداشتی",
    "خرید محصولات مراقبت پوست",
    "محصولات مراقبت مو",
    "خرید عمده لوازم آرایشی",
    "پخش محصولات بهداشتی",
    "برندهای آرایشی",
    "JALALI COSMETICS",
  ],

  authors: [
    {
      name: "پخش جلالی",
      url: SITE_URL,
    },
  ],

  creator: "JALALI COSMETICS",
  publisher: "JALALI COSMETICS",

  category: "فروشگاه اینترنتی لوازم آرایشی و بهداشتی",

  alternates: {
    canonical: "/",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: SITE_URL,
    siteName: "پخش جلالی",
    title: "پخش جلالی | زیبایی، انتخاب و اعتماد",
    description:
      "دنیایی از محصولات آرایشی، بهداشتی و مراقبت زیبایی؛ مشاهده محصولات، آشنایی با برندها و ثبت درخواست همکاری تجاری.",
  },

  twitter: {
    card: "summary_large_image",
    title: "پخش جلالی | فروشگاه تخصصی زیبایی",
    description:
      "محصولات آرایشی و بهداشتی، برندهای متنوع و خدمات همکاری تجاری.",
  },

  formatDetection: {
    telephone: true,
    email: true,
    address: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0B0B0D",
  colorScheme: "light",
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
