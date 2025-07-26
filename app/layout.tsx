import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Inventory Management System - FIFO Costing",
  description: "Modern inventory management system with FIFO costing and real-time Kafka integration",
  keywords: ["inventory", "management", "FIFO", "costing", "kafka", "real-time"],
  authors: [{ name: "Inventory Management Team" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
