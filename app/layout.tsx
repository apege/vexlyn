import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vexlyn Gamers - Top Up Robux Murah & Terpercaya Indonesia",
  description:
    "Top up Robux murah, instan 1-5 menit, resmi dan 100% aman anti-banned. Tanpa password, hanya butuh Username Roblox. Official Vexlyn Gamers Indonesia.",
  icons: {
    icon: "/logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="scroll-smooth overflow-x-hidden w-full max-w-full">
      <body className="min-h-screen bg-[#FFF5F8] text-[#220813] selection:bg-rose-600 selection:text-white antialiased overflow-x-hidden w-full max-w-full">
        {children}
      </body>
    </html>
  );
}
