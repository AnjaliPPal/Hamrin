import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Hamrin.ai — Stripe Retention OS | Cancel Flows, Payment Recovery & Reactivation",
  description:
    "Turn your cancel button into a retention engine. Recover failed payments, run win-back campaigns, and show a payment wall — all for Stripe. Pay $0 upfront + 10% of recovered revenue, or $99/mo flat.",
  keywords: [
    "Stripe retention",
    "payment recovery",
    "cancel flow",
    "reactivation campaigns",
    "failed payment recovery",
    "subscription retention",
    "churn reduction",
  ],
  openGraph: {
    title: "Hamrin.ai — Stripe Retention OS",
    description: "Cancel flows, payment recovery, reactivation campaigns. Pay only when we recover.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${lora.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
