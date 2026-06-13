import { NavBar } from "@/components/nav-bar";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <NavBar />
        <main className="mx-auto w-full max-w-[1340px] flex-1 px-7 py-8">{children}</main>
      </div>
    </AuthGuard>
  );
}
