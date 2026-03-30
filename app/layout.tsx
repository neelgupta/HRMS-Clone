import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppToaster } from "@/components/providers/app-toaster";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HRMS SaaS",
  description: "Multi-tenant HRMS authentication and onboarding platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ backgroundColor: "#f8fafc", colorScheme: "light" }}
    >
      <body
        className="min-h-full bg-slate-50 font-sans text-slate-900"
        style={{ backgroundColor: "#f8fafc", color: "#0f172a" }}
      >
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
