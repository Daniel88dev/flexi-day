import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import NavigationBar from "@/app/(auth)/_navigateBar/NavigationBar";
import Footer from "@/app/_footer/Footer";

const AuthLayout = async ({ children }: { children: ReactNode }) => {
  const user = await currentUser();

  if (!user) {
    redirect("/");
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <NavigationBar />
      <main className="flex-1 py-6 md:py-8 lg:py-10">{children}</main>
      <Footer />
    </div>
  );
};

export default AuthLayout;
