import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Casebook", template: "%s — Casebook" },
  description: "Professional legal case management for advocates, associates and clients.",
  icons: { icon: "/app-icon.jpg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
