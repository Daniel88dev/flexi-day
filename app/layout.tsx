import type { Metadata } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { QueryProvider } from "@/components/query-provider";
import { ThemeProvider } from "@/components/theme-provider";

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "flexiday — time off, handled with care",
  description:
    "The calm, shared calendar for team time off. See who's in, who's away, and approve requests in a click.",
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
      className={cn("h-full antialiased", hanken.variable, bricolage.variable, instrument.variable)}
    >
      <body className="bg-background text-foreground flex min-h-full flex-col font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
