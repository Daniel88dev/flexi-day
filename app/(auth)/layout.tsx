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
      <main>{children}</main>
    </>
  );
};

export default AuthLayout;
