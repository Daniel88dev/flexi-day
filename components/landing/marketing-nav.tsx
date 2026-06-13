"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/ModeToggle";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
];

export function MarketingNav() {
  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{
        background: "var(--nav-bg)",
        backdropFilter: "blur(14px)",
        borderColor: "var(--border)",
      }}
    >
      <div className="mx-auto flex h-[70px] max-w-6xl items-center gap-6 px-7">
        <Logo size={26} />
        <nav className="ml-6 hidden gap-7 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[15px] font-medium transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          <ModeToggle />
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="gap-2">
            <Link href="/sign-up">
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
