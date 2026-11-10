import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import "./premium.css";
import { programme } from "@/lib/content";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-serif", display: "swap", weight: ["400", "600"], style: ["normal", "italic"] });

const site = process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:5330");

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: `${programme.name} | ${programme.university}`, template: `%s | ${programme.university}` },
  description: `The ${programme.name} meets the full cost of attendance for four years of undergraduate study at ${programme.university} for students of exceptional promise and demonstrated financial need.`,
  icons: { icon: "/icon.png", apple: "/apple-icon.png" },
  openGraph: { title: programme.name, description: "Four years of undergraduate study, with the full cost of attendance met.", images: ["/logo-full.png"] },
};

export const viewport: Viewport = { themeColor: "#06243c", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`} suppressHydrationWarning>
      <body>
        {/* Lets CSS hide scroll-reveal content only when JavaScript is running to reveal it. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <a className="skip" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
