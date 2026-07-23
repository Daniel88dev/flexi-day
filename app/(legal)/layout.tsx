import { LegalHeader } from "@/components/legal/legal-header";
import { Footer } from "@/components/footer";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--bg)" }}>
      <LegalHeader />

      <main className="flex-1">{children}</main>

      <Footer />
    </div>
  );
}
