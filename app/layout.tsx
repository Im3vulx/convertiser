import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'MultiTools - Suite Créative',
  description: 'Boîte à outils multimédia locale',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex h-screen overflow-hidden bg-gray-50 text-gray-900 font-sans antialiased">

        <Toaster position="bottom-right" richColors />

        <Sidebar />

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </body>
    </html>
  );
}
