import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import AuthSessionManager from "@/components/AuthSessionManager";
import "./globals.css";

export const metadata: Metadata = {
  title: "FakeNews AI",
  description: "AI and machine learning fake news detection web app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthSessionManager />
        <Navbar />
        {children}
      </body>
    </html>
  );
}