import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Muziks — Studio de génération musicale IA (ACE-Step 1.5)",
  description:
    "Muziks : studio web complet propulsé par ACE-Step 1.5 — génération Text2Music, remix, repaint, séparation de pistes, LoRA training, analyse audio et Model Zoo.",
  keywords: ["Muziks", "ACE-Step", "génération musicale", "IA", "musique", "text2music", "LoRA"],
  authors: [{ name: "Muziks" }],
  icons: { icon: "/logo-muziks.svg" },
  openGraph: {
    title: "Muziks — Studio de génération musicale IA",
    description: "Générez, remixez, séparez et entraînez — propulsé par ACE-Step 1.5.",
    siteName: "Muziks",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a1815",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
