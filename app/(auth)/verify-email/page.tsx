import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-static";

export default function VerifyEmailPage() {
  return (
    <AuthCard
      title="Check your inbox"
      description="We sent a verification link. Click it to finish setting up your account."
      footer={
        <Link href="/sign-in" className="text-primary font-medium hover:underline">
          Back to sign in
        </Link>
      }
    >
      <p className="text-muted-foreground text-sm">
        Once you verify, you&apos;ll be signed in automatically and dropped on the dashboard.
      </p>
      <div className="mt-5">
        <Button asChild variant="outline" className="w-full">
          <Link href="/sign-in">Already verified? Sign in</Link>
        </Button>
      </div>
    </AuthCard>
  );
}
