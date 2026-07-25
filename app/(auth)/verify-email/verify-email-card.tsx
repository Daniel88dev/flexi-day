"use client";

import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/use-translation";

export function VerifyEmailCard() {
  const { t } = useTranslation();
  return (
    <AuthCard
      title={t.auth.verify.title}
      description={t.auth.verify.description}
      footer={
        <Link href="/sign-in" className="text-primary font-medium hover:underline">
          {t.auth.verify.backToSignIn}
        </Link>
      }
    >
      <p className="text-muted-foreground text-sm">{t.auth.verify.body}</p>
      <div className="mt-5">
        <Button asChild variant="outline" className="w-full">
          <Link href="/sign-in">{t.auth.verify.alreadyVerified}</Link>
        </Button>
      </div>
    </AuthCard>
  );
}
