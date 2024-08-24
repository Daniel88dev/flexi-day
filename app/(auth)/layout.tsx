import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import NavigationBar from "@/app/(auth)/_navigateBar/NavigationBar";

const AuthLayout = async ({ children }: { children: ReactNode }) => {
  const user = await currentUser();

  if (!user) {
    redirect("/");
  }

  return (
    <>
      <NavigationBar />
      <main className="flex-1 py-6 md:py-8 lg:py-10">{children}</main>
    </>
  );
};

export default AuthLayout;
