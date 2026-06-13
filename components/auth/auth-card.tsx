import { cn } from "@/lib/utils";

interface AuthCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function AuthCard({ title, description, children, footer, className }: AuthCardProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="mb-7 space-y-2">
        <h1
          className="font-display font-semibold"
          style={{ fontSize: 34, letterSpacing: "-0.03em" }}
        >
          {title}
        </h1>
        {description ? (
          <p className="text-[16px]" style={{ color: "var(--text-muted)" }}>
            {description}
          </p>
        ) : null}
      </div>
      {children}
      {footer ? (
        <div className="mt-6 text-center text-[14.5px]" style={{ color: "var(--text-muted)" }}>
          {footer}
        </div>
      ) : null}
    </div>
  );
}

export function AuthError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="bg-destructive/10 text-destructive border-destructive/30 rounded-2xl border px-3 py-2 text-sm"
    >
      {message}
    </div>
  );
}

export function AuthSuccess({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="rounded-2xl border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300"
    >
      {message}
    </div>
  );
}

export function GoogleButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-center gap-2.5 rounded-full border px-4 py-3 text-[15px] font-semibold transition-colors"
      style={{
        borderColor: "var(--border-strong)",
        background: "var(--surface)",
        color: "var(--text)",
      }}
      // TODO: wire to authClient.signIn.social({ provider: "google" }) once OAuth is configured.
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
        <path
          fill="#4285F4"
          d="M22.5 12.2c0-.7-.06-1.4-.18-2.06H12v3.9h5.9a5 5 0 0 1-2.18 3.3v2.74h3.52c2.06-1.9 3.26-4.7 3.26-7.88z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.94 0 5.4-.97 7.2-2.63l-3.52-2.73c-.98.66-2.23 1.05-3.68 1.05-2.83 0-5.23-1.91-6.09-4.48H2.27v2.82A11 11 0 0 0 12 23z"
        />
        <path fill="#FBBC05" d="M5.91 14.21a6.6 6.6 0 0 1 0-4.42V6.97H2.27a11 11 0 0 0 0 9.86z" />
        <path
          fill="#EA4335"
          d="M12 5.5c1.6 0 3.03.55 4.16 1.62l3.12-3.12C17.4 2.2 14.94 1.2 12 1.2A11 11 0 0 0 2.27 6.97l3.64 2.82C6.77 7.4 9.17 5.5 12 5.5z"
        />
      </svg>
      {label}
    </button>
  );
}

export function AuthDivider({ label = "or with email" }: { label?: string }) {
  return (
    <div
      className="my-5 flex items-center gap-3.5 text-[13px]"
      style={{ color: "var(--text-faint)" }}
    >
      <span className="h-px flex-1" style={{ background: "var(--border)" }} />
      {label}
      <span className="h-px flex-1" style={{ background: "var(--border)" }} />
    </div>
  );
}
