import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YTAudio - Premium YouTube to MP3 Converter",
  description: "Download high-fidelity YouTube audio as MP3 instantly. Clean, fast, and free of ads.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
