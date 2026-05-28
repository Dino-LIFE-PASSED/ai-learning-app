import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LRN",
  description: "เรียนรู้ทุกหัวข้อด้วย AI",
  icons: {
    icon: "/LRN_logo.png",
    apple: "/LRN_logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[#0c0e13] text-gray-100 antialiased">
        <header className="border-b border-gray-800/80 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-50 bg-[#0c0e13]/95 backdrop-blur">
          <Link href="/" className="flex items-center gap-2 font-black text-base sm:text-lg tracking-widest">
            <span className="text-white">LRN</span>
            <span className="w-2 h-2 rounded-full bg-gradient-to-br from-orange-400 to-red-600 -mt-3 shrink-0" />
          </Link>
          <Link
            href="/topics"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-100 active:text-white transition-colors py-2 px-3 -mr-3 rounded-lg font-mono"
          >
            <span className="text-orange-500/60">||</span>
            <span>topics</span>
          </Link>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
