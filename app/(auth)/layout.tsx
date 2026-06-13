import { Logo } from "@/components/brand/logo";
import { BrandPanel } from "@/components/auth/brand-panel";
import { ModeToggle } from "@/components/ui/ModeToggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen md:grid-cols-2" style={{ background: "var(--bg)" }}>
      <div
        className="flex flex-col px-6 py-8"
        style={{ paddingLeft: "clamp(24px, 6vw, 80px)", paddingRight: "clamp(24px, 6vw, 80px)" }}
      >
        <div className="flex items-center justify-between">
          <Logo size={25} />
          <ModeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-10">
          {children}
        </div>
      </div>
      <BrandPanel />
    </div>
  );
}
