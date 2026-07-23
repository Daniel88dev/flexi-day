import { NavBar } from "@/components/nav-bar";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Footer } from "@/components/footer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <NavBar />
        <main className="mx-auto w-full max-w-[1340px] flex-1 px-7 py-8 max-[820px]:px-4">
          {children}
        </main>
        <Footer containerClassName="max-w-[1340px] max-[820px]:px-4" />
      </div>
    </AuthGuard>
  );
}
