"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import type { DirectoryPhone } from "@/lib/api/directory";
import { useTranslation } from "@/lib/i18n/use-translation";

export function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[max-content_1fr]">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted-foreground">{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function PhoneLink({ phone }: { phone: DirectoryPhone }) {
  return (
    <a href={`tel:${phone.e164}`} className="text-primary hover:underline">
      {phone.display}
    </a>
  );
}

export function EmailLink({ email }: { email: string }) {
  return (
    <a href={`mailto:${email}`} className="text-primary hover:underline">
      {email}
    </a>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <p className="text-muted-foreground text-xs">
      <Link
        href={href}
        className="hover:text-foreground inline-flex items-center gap-1 hover:underline"
      >
        <ChevronLeft className="h-3 w-3" aria-hidden />
        {children}
      </Link>
    </p>
  );
}

/** A refused profile read says the person isn't there; anything else says the read failed. */
export function ProfileReadFailure({ error, back }: { error: Error; back: ReactNode }) {
  const { t } = useTranslation();
  const missing = error instanceof ApiError && [403, 404, 409].includes(error.status);
  return (
    <div className="space-y-4">
      {back}
      <p className={missing ? "text-muted-foreground text-sm" : "text-destructive text-sm"}>
        {missing ? t.directory.profile.notFound : t.directory.profile.loadFailed}
      </p>
    </div>
  );
}
