import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SOLACE — Breathing Room Generator",
  description: "Create long-form ambient breathing room videos for sleep, meditation, focus, and music",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-background text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}

