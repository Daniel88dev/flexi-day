import { NavBar } from "@/components/nav-bar";
import { GraceBanner } from "@/components/billing/grace-banner";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Footer } from "@/components/footer";
import { ToastHost } from "@/components/toast";
import { VacationDetailHost } from "@/components/vacation-detail-host";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <NavBar />
        <GraceBanner />
        <main className="mx-auto w-full max-w-[1340px] flex-1 px-7 py-8 max-[820px]:px-4">
          {children}
        </main>
        <Footer containerClassName="max-w-[1340px] max-[820px]:px-4" />
      </div>
      {/* Mounted once for the whole app; any screen can `pushToast`. */}
      <ToastHost />
      {/* Likewise: `?vacationId=` opens the request detail on any page. */}
      <VacationDetailHost />
    </AuthGuard>
  );
}
