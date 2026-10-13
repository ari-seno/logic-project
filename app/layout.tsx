import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { siteUrl } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Logic Project",
    template: "%s · Logic Project",
  },
  description:
    "Logic Project — an AI Project Planner. Capture requirements, decisions, architecture, tasks, and prompts; the user remains the decision maker.",
  openGraph: {
    title: "Logic Project",
    description:
      "An AI Project Planner that structures requirements, decisions, architecture, tasks, and agent prompts.",
    type: "website",
    url: siteUrl,
    siteName: "Logic Project",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-foreground">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
