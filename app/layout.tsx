import { ClerkProvider, SignInButton, SignedOut } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/ModeToggle";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Flexi Day",
  description:
    "Application to manage your vacations, Home office, and overall absence in work",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={cn(
            "min-h-screen bg-background font-sans antialiased",
            fontSans.variable
          )}
        >
          <ThemeProvider attribute="class" defaultTheme="system">
            <SignedOut>
              <header>
                <ModeToggle />
                <SignInButton />
              </header>
            </SignedOut>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
