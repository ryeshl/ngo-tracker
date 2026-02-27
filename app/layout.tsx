import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import Link from "next/link";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk"
});

export const metadata: Metadata = {
  title: "NGO Financial Tracker",
  description: "Offline-first NGO expense tracking and public transparency",
  manifest: "/manifest.webmanifest"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} font-[family-name:var(--font-space-grotesk)]`}>
        <ServiceWorkerRegistration />
        <div className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-16 pt-5 sm:px-6 lg:px-8">
          <header className="mb-8 rounded-2xl border border-emerald-100 bg-panel/95 p-4 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link href="/" className="text-lg font-bold tracking-tight text-text">
                Lean NGO Tracker
              </Link>
              <nav className="flex flex-wrap gap-2 text-sm">
                <Link className="rounded-lg bg-emerald-50 px-3 py-2 text-muted transition hover:bg-emerald-100" href="/expenses/new">
                  New Expense
                </Link>
                <Link className="rounded-lg bg-emerald-50 px-3 py-2 text-muted transition hover:bg-emerald-100" href="/admin">
                  Admin
                </Link>
                <Link className="rounded-lg bg-emerald-50 px-3 py-2 text-muted transition hover:bg-emerald-100" href="/login">
                  Login
                </Link>
              </nav>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
