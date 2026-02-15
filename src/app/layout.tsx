import type { Metadata } from "next";
import { playfair, inter } from "@/styles/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "curated objects — vintage home goods",
  description:
    "discover beautifully curated vintage home goods from trusted sellers and marketplaces worldwide.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-canvas font-body text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
