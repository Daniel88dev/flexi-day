import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignedIn, UserButton } from "@clerk/nextjs";
import { ReactNode } from "react";

const AuthLayout = async ({ children }: { children: ReactNode }) => {
  const user = await currentUser();

  if (!user) {
    redirect("/");
  }

  return (
    <>
      <header>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </header>
      <main>{children}</main>
    </>
  );
};

export default AuthLayout;
