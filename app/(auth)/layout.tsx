import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignedIn, UserButton } from "@clerk/nextjs";
import { ReactNode } from "react";
import { ModeToggle } from "@/components/ModeToggle";

const AuthLayout = async ({ children }: { children: ReactNode }) => {
  const user = await currentUser();

  if (!user) {
    redirect("/");
  }

  return (
    <>
      <SignedIn>
        <header>
          <ModeToggle />
          <UserButton />
        </header>
      </SignedIn>
      <main>{children}</main>
    </>
  );
};

export default AuthLayout;
