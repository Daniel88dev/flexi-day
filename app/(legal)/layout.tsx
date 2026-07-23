import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ModeToggle } from "@/components/ui/ModeToggle";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/footer";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--bg)" }}>
      <header
        className="sticky top-0 z-40 border-b"
        style={{
          background: "var(--nav-bg)",
          backdropFilter: "blur(14px)",
          borderColor: "var(--border)",
        }}
      >
        <div className="mx-auto flex h-[66px] w-full max-w-6xl items-center gap-4 px-7 max-[600px]:px-5">
          <Logo size={25} href="/" />
          <div className="flex-1" />
          <ModeToggle />
          <Button asChild size="sm" variant="outline" className="max-[520px]:hidden">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <Footer />
    </div>
  );
}
