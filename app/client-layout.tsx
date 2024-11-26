"use client";

import { Inter } from 'next/font/google';
import "./globals.css";
import Sidebar from '@/components/Sidebar';
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/context/AuthContext";

const inter = Inter({ subsets: ['latin'] });

export function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 ml-16 lg:ml-64 p-4">
                {children}
              </main>
            </div>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
} 