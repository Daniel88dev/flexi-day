import { AppShell } from "@/components/shell/app-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { ToastHost } from "@/components/toast";
import { VacationDetailHost } from "@/components/vacation-detail-host";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      {/* Mounted once for the whole app; any screen can `pushToast`. It sits
          ABOVE {children} on purpose: `pushToast` delivers synchronously to
          whoever is subscribed at that moment, and React runs a subtree's
          effects before a later sibling's — so a page pushing from its own
          mount effect (the connected-accounts card, after an OAuth redirect
          lands back here) would find no listener and its toast would vanish. */}
      <ToastHost />
      <AppShell>{children}</AppShell>
      {/* `?vacationId=` opens the request detail on any page. */}
      <VacationDetailHost />
    </AuthGuard>
  );
}
