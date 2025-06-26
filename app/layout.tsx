// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextAuthProvider } from "@/components/Providers"; // Import our new provider
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gyana AI",
  description: "The smarter way to master any subject.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* We wrap the entire app in the provider here */}
        <NextAuthProvider>{children}</NextAuthProvider>
      </body>
    </html>
  );
}