import type { Metadata } from "next";
import { Poppins } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["700"],
});

export const metadata: Metadata = {
  title: "Order Management",
  description: "ERP-style order management for footwear articles",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} h-full antialiased font-bold`}
    >
      <body className="min-h-full flex flex-col font-bold">
        {children}
        <Toaster richColors closeButton position="top-right" />
      </body>
    </html>
  );
}
