import type { Metadata } from "next";
import {Inter } from "next/font/google";
import "./globals.css";


const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Radio-tunes",
  description: "Radio-tunes listen to radio stations worldwide",
  keywords: ["radio", "stations", "worldwide", "music", "audio", "streaming"],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Radio-tunes",
    description: "Radio-tunes listen to radio stations worldwide",
    type: "website",
    locale: "en",
    siteName: "Radio-tunes",
    url: "https://radiotunes.vercel.app",
    images: [
      {
        url: "https://radiotunes.vercel.app/screenshot_dark.png",
        width: 1200,
        height: 630,
        alt: "Radio-tunes",
      },
      {
        url: "https://radiotunes.vercel.app/screenshot.png",
        width: 1200,
        height: 630,
        alt: "Radio-tunes",
      },
    ],
  },
  twitter: {
    title: "Radio-tunes",
    description: "Radio-tunes listen to radio stations worldwide",
    card: "summary_large_image",
    images: ['https://radiotunes.vercel.app/screenshot_dark.png', 'https://radiotunes.vercel.app/screenshot.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
