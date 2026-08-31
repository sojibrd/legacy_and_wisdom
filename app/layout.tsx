import type { Metadata } from "next";
import {
  Barlow_Semi_Condensed,
  JetBrains_Mono,
  Noto_Sans_Bengali,
} from "next/font/google";
import "./globals.css";
import { getNav } from "./lib/content";
import Shell from "./components/Shell";

const condensed = Barlow_Semi_Condensed({
  variable: "--font-condensed",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono-family",
  subsets: ["latin"],
  display: "swap",
});

const bengali = Noto_Sans_Bengali({
  variable: "--font-bengali",
  subsets: ["bengali", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Legacy & Wisdom",
    template: "%s — Legacy & Wisdom",
  },
  description: "জীবনের দীর্ঘমেয়াদি রোডম্যাপ — ১০টা stage-এ ভাগ করা (Technical, Financial, Health, Family)।",
  other: {
    "theme-color": "#17140f",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="bn"
      className={`${condensed.variable} ${mono.variable} ${bengali.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Shell nav={getNav()}>{children}</Shell>
      </body>
    </html>
  );
}
