import Footer from "@/components/Footer";
import { NextAuthProvider } from "@/components/NextAuthProvider";
import { ToastProvider } from "@/components/ToastProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Geist, Geist_Mono } from "next/font/google";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Student Hub",
  description: "Connect, discover, and collaborate with students across campus",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <SpeedInsights/>
        <Analytics/>
        <NextAuthProvider>
          <AuthProvider>
            <div className="flex-1">
              {children}
            </div>
            <Footer />
            <ToastProvider />
          </AuthProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
