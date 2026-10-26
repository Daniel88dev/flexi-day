import type { ReactNode } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DirectoryOrganization } from "@/lib/api/directory";
import { useTranslation } from "@/lib/i18n/use-translation";

/** On every directory page while the plan fails the gate. Reads keep working. */
export function DirectoryLapsedBanner({ organization }: { organization: DirectoryOrganization }) {
  const { t } = useTranslation();
  if (!organization.enabled || organization.writable) return null;
  const copy = t.directory.lapsed;
  return (
    <div
      role="status"
      data-testid="directory-lapsed"
      className="flex flex-wrap items-center gap-3 rounded-[var(--radius)] border border-[color:var(--warm)]/40 bg-[var(--warm-soft)] px-4 py-3"
    >
      <Lock className="h-4 w-4 shrink-0 text-[color:var(--warm)]" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{copy.title}</p>
        <p className="text-muted-foreground text-xs">{copy.body}</p>
      </div>
      {organization.role !== "MEMBER" ? (
        <Button asChild size="sm" variant="outline">
          <Link href="/billing">{copy.seePlans}</Link>
        </Button>
      ) : null}
    </div>
  );
}

/** A settings panel's line while the plan has lapsed. */
export function LapsedNote({ children }: { children: ReactNode }) {
  return <p className="text-sm text-[color:var(--warm)]">{children}</p>;
}
