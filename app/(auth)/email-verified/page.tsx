"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { AuthCard, AuthError, AuthSuccess } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/use-translation";

export default function EmailVerifiedPage() {
  return (
    <Suspense fallback={null}>
      <EmailVerifiedContent />
    </Suspense>
  );
}

function EmailVerifiedContent() {
  const { t } = useTranslation();
  const params = useSearchParams();
  // The API redirects here after verifying the token. On failure better-auth
  // appends `?error=<code>`; on success there is no `error` param.
  const isError = params.get("error") !== null;

  if (isError) {
    return (
      <AuthCard
        title={t.auth.verified.failTitle}
        description={t.auth.verified.failDescription}
        footer={
          <Link
            href="/sign-up"
            className="font-bold hover:underline"
            style={{ color: "var(--primary)" }}
          >
            {t.auth.verified.createNew}
          </Link>
        }
      >
        <AuthError message={t.auth.verified.failMessage} />
        <div className="mt-5">
          <Button asChild size="lg" className="w-full gap-2 rounded-full">
            <Link href="/sign-in">
              {t.auth.verified.goToSignIn} <ArrowRight className="h-[18px] w-[18px]" />
            </Link>
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={t.auth.verified.okTitle}
      description={t.auth.verified.okDescription}
      footer={
        <Link
          href="/sign-in"
          className="font-medium hover:underline"
          style={{ color: "var(--primary)" }}
        >
          {t.auth.verified.backToSignIn}
        </Link>
      }
    >
      <AuthSuccess message={t.auth.verified.okMessage} />
      <div className="mt-5">
        <Button asChild size="lg" className="w-full gap-2 rounded-full">
          <Link href="/sign-in">
            {t.auth.verified.continue} <ArrowRight className="h-[18px] w-[18px]" />
          </Link>
        </Button>
      </div>
    </AuthCard>
  );
}
