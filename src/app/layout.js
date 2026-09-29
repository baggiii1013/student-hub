import ConnectionStatus from "@/components/ConnectionStatus";
import Footer from "@/components/Footer";
import { NextAuthProvider } from "@/components/NextAuthProvider";
import { ToastProvider } from "@/components/ToastProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Geist, Geist_Mono } from "next/font/google";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import styles from "./layout.module.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL("https://parul-student-hub.vercel.app"),
  title: "Student Hub | Connect, Discover & Collaborate",
  description: "Connect, discover, and collaborate with students across campus. Enter the exact UG number to find student information.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Student Hub | Connect, Discover & Collaborate",
    description: "Connect, discover, and collaborate with students across campus. Enter the exact UG number to find student information.",
    url: "https://parul-student-hub.vercel.app",
    siteName: "Student Hub",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${styles.body}`}
      >
        <SpeedInsights/>
        <Analytics/>
        <NextAuthProvider>
          <AuthProvider>
            <ConnectionStatus />
            <div className={styles.container}>
              <div className={styles.main}>
                {children}
              </div>
              <div className={styles.footer}>
                <Footer />
              </div>
            </div>
            <ToastProvider />
          </AuthProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
