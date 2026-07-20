"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { AuthCard, AuthError, AuthSuccess } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";

export default function EmailVerifiedPage() {
  return (
    <Suspense fallback={null}>
      <EmailVerifiedContent />
    </Suspense>
  );
}

function EmailVerifiedContent() {
  const params = useSearchParams();
  // The API redirects here after verifying the token. On failure better-auth
  // appends `?error=<code>`; on success there is no `error` param.
  const isError = params.get("error") !== null;

  if (isError) {
    return (
      <AuthCard
        title="Verification failed"
        description="This confirmation link is invalid or has expired."
        footer={
          <Link
            href="/sign-up"
            className="font-bold hover:underline"
            style={{ color: "var(--primary)" }}
          >
            Create a new account
          </Link>
        }
      >
        <AuthError message="Your email couldn't be verified. Sign in to request a fresh verification link." />
        <div className="mt-5">
          <Button asChild size="lg" className="w-full gap-2 rounded-full">
            <Link href="/sign-in">
              Go to sign in <ArrowRight className="h-[18px] w-[18px]" />
            </Link>
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Email verified"
      description="Thanks for confirming your email address. Your account is now active."
      footer={
        <Link
          href="/sign-in"
          className="font-medium hover:underline"
          style={{ color: "var(--primary)" }}
        >
          Back to sign in
        </Link>
      }
    >
      <AuthSuccess message="You're all set — your email address has been verified." />
      <div className="mt-5">
        <Button asChild size="lg" className="w-full gap-2 rounded-full">
          <Link href="/sign-in">
            Continue to sign in <ArrowRight className="h-[18px] w-[18px]" />
          </Link>
        </Button>
      </div>
    </AuthCard>
  );
}