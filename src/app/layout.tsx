import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { Suspense } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProgressBar } from "@/components/ProgressBar";
import { SessionProvider } from "@/components/SessionProvider";
import { VerificationBanner } from "@/components/VerificationBanner";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { isEmailVerificationEnabled } from "@/lib/mail";
import { buildMetadata } from "@/lib/seo";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
  fallback: ["Georgia", "serif"],
});

export const metadata: Metadata = buildMetadata({
  title: "Handcrafted & Bridal Jewellery",
  description:
    "Explore handcrafted, handmade, minimalist and bridal jewellery from JewelsCart. Handcrafted with elegance in India.",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${cormorant.variable} min-h-screen w-full overflow-x-hidden bg-stone-50 text-stone-900 antialiased`}
      >
        <SessionProvider>
          <Suspense fallback={null}>
            <ProgressBar />
          </Suspense>
          <Suspense fallback={null}>
            <VerificationBanner enabled={isEmailVerificationEnabled()} />
          </Suspense>
          <Suspense fallback={null}>
            <AnalyticsTracker />
          </Suspense>
          <CookieConsentBanner />
          <Header />
          <CartDrawer />
          <main className="w-full max-w-full min-w-0 flex-1">{children}</main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
