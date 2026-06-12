import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono, EB_Garamond } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { StoreProvider } from "@/lib/store";
import { ThemeProvider } from "@/components/theme-provider";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flexi Day — Team Vacations",
  description: "Manage your team's vacations and time off",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full antialiased",
        jakarta.variable,
        ebGaramond.variable,
        geistMono.variable
      )}
    >
      <body className="bg-background text-foreground flex min-h-full flex-col font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <StoreProvider>{children}</StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
