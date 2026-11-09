import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { programme } from "@/lib/content";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-serif", display: "swap", weight: ["400", "600"], style: ["normal", "italic"] });

const site = process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:5330");

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: `${programme.name} | ${programme.university}`, template: `%s | ${programme.university}` },
  description: `A fully funded four-year undergraduate scholarship at ${programme.university} for students whose families cannot meet the cost of university. Free to apply.`,
  icons: { icon: "/icon.png", apple: "/apple-icon.png" },
  openGraph: { title: programme.name, description: "Four years of fully funded study. Free to apply.", images: ["/logo-full.png"] },
};

export const viewport: Viewport = { themeColor: "#06243c", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
