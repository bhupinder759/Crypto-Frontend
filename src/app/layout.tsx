import type { Metadata } from "next";
import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import { siteConfig } from "@/config/site";
import "./globals.css";

const bodyFont = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const headingFont = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    url: siteConfig.url,
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${bodyFont.variable} ${headingFont.variable}`}
    >
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
