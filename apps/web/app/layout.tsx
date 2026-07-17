import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { NavBar } from "./nav-bar";

const vazirmatn = localFont({
  src: "./fonts/Vazirmatn-Variable.woff2",
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  title: "بهدون | نوبت‌دهی آنلاین سالن و آرایشگاه",
  description: "سالن و آرایشگاه مورد اعتماد پیدا کنید و نوبت آنلاین رزرو کنید",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} h-full`}>
      <body className="flex min-h-full flex-col antialiased">
        <NavBar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
