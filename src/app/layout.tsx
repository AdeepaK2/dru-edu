import type { Metadata } from "next";
import { Inter, Poppins, Merriweather } from "next/font/google";
import "./globals.css";

// Configure fonts with subsets
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

const merriweather = Merriweather({
  weight: ["300", "400", "700"],
  subsets: ["latin"],
  variable: "--font-merriweather",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dr. U Education",
  description: "Educational platform by Dr. U Education",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable} ${merriweather.variable}`}>
      <body className="antialiased font-sans bg-gradient-to-br from-white to-primary-50 dark:from-gray-900 dark:to-gray-800 min-h-screen">
        {children}
      </body>
    </html>
  );
}
